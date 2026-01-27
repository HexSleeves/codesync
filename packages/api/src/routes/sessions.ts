/**
 * Session routes - CRUD for code review sessions
 */

import { createSessionSchema, updateSessionSchema, updateSessionStatusSchema } from '@codesync/shared';
import type { SessionStatus } from '@codesync/shared';
import { zValidator } from '@hono/zod-validator';
import { desc, eq, or } from 'drizzle-orm';
import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { db } from '../db/client';
import { files, sessionParticipants, sessions, users } from '../db/schema';
import { type AuthVariables, authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { checkSessionAccess, checkSessionOwnership } from '../services/session/access';

export const sessionRoutes = new Hono<{ Variables: AuthVariables }>()
  // GET /api/sessions - List sessions for current user
  .get('/', authMiddleware, async (c) => {
    const userId = c.get('userId');

    const userSessions = await db
      .select()
      .from(sessions)
      .where(or(eq(sessions.createdBy, userId), eq(sessions.isPublic, true)))
      .orderBy(desc(sessions.updatedAt));

    return c.json({ sessions: userSessions });
  })

  // POST /api/sessions - Create a new session
  .post('/', authMiddleware, zValidator('json', createSessionSchema), async (c) => {
    const userId = c.get('userId');
    const data = c.req.valid('json');

    const [session] = await db
      .insert(sessions)
      .values({
        ...data,
        createdBy: userId,
        shareToken: data.isPublic ? nanoid(12) : null,
      })
      .returning();

    // Add creator as owner participant
    await db.insert(sessionParticipants).values({
      sessionId: session.id,
      userId,
      role: 'owner',
    });

    return c.json({ session }, 201);
  })

  // GET /api/sessions/:id - Get session by ID
  .get('/:id', optionalAuthMiddleware, async (c) => {
    const { id } = c.req.param();
    const userId = c.get('userId');

    const access = await checkSessionAccess(id, userId);

    if (access.error === 'not_found') {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (access.error === 'access_denied') {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Get files for session
    const sessionFiles = await db.select().from(files).where(eq(files.sessionId, id));

    return c.json({ session: access.session, files: sessionFiles });
  })

  // PATCH /api/sessions/:id - Update session
  .patch('/:id', authMiddleware, zValidator('json', updateSessionSchema), async (c) => {
    const { id } = c.req.param();
    const userId = c.get('userId');
    const data = c.req.valid('json');

    const access = await checkSessionOwnership(id, userId);

    if (access.error === 'not_found') {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (access.error === 'access_denied') {
      return c.json({ error: 'Not authorized' }, 403);
    }

    const [updatedSession] = await db
      .update(sessions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, id))
      .returning();

    return c.json({ session: updatedSession });
  })

  // DELETE /api/sessions/:id - Delete session
  .delete('/:id', authMiddleware, async (c) => {
    const { id } = c.req.param();
    const userId = c.get('userId');

    const access = await checkSessionOwnership(id, userId);

    if (access.error === 'not_found') {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (access.error === 'access_denied') {
      return c.json({ error: 'Not authorized' }, 403);
    }

    // Delete session (cascades to files, comments, etc.)
    await db.delete(sessions).where(eq(sessions.id, id));

    return c.json({ success: true });
  })

  // POST /api/sessions/:id/review/start - Start review
  .post('/:id/review/start', authMiddleware, async (c) => {
    const { id } = c.req.param();
    const userId = c.get('userId');

    const access = await checkSessionOwnership(id, userId);

    if (access.error === 'not_found') {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (access.error === 'access_denied') {
      return c.json({ error: 'Not authorized' }, 403);
    }

    const [updatedSession] = await db
      .update(sessions)
      .set({ status: 'in_review', updatedAt: new Date() })
      .where(eq(sessions.id, id))
      .returning();

    return c.json({ session: updatedSession });
  })

  // PATCH /api/sessions/:id/status - Update session status with workflow tracking
  .patch('/:id/status', authMiddleware, zValidator('json', updateSessionStatusSchema), async (c) => {
    const { id } = c.req.param();
    const userId = c.get('userId');
    const { status: newStatus } = c.req.valid('json');

    // Check access (reviewers can change status, not just owners)
    const access = await checkSessionAccess(id, userId);

    if (access.error === 'not_found') {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (access.error === 'access_denied') {
      return c.json({ error: 'Access denied' }, 403);
    }

    const session = access.session!;
    const currentStatus = session.status as SessionStatus;
    const now = new Date();

    // Validate status transitions
    const validTransitions: Record<SessionStatus, SessionStatus[]> = {
      draft: ['in_review'],
      in_review: ['approved', 'draft'], // can approve or request changes (back to draft)
      approved: ['merged', 'in_review'], // can merge or reopen review
      merged: ['approved'], // can unmerge back to approved
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      return c.json(
        { error: `Cannot transition from '${currentStatus}' to '${newStatus}'` },
        400
      );
    }

    // Build update object based on transition
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedAt: now,
    };

    // Track who and when for each status change
    if (newStatus === 'in_review' && currentStatus === 'draft') {
      updateData.reviewStartedAt = now;
      updateData.reviewStartedBy = userId;
    } else if (newStatus === 'approved') {
      updateData.approvedAt = now;
      updateData.approvedBy = userId;
    } else if (newStatus === 'merged') {
      updateData.mergedAt = now;
      updateData.mergedBy = userId;
    } else if (newStatus === 'draft') {
      // Going back to draft clears approval
      updateData.approvedAt = null;
      updateData.approvedBy = null;
    } else if (newStatus === 'in_review' && currentStatus === 'approved') {
      // Reopening review clears approval
      updateData.approvedAt = null;
      updateData.approvedBy = null;
    }

    const [updatedSession] = await db
      .update(sessions)
      .set(updateData)
      .where(eq(sessions.id, id))
      .returning();

    // Fetch user info for reviewer/approver/merger
    const result = { ...updatedSession, reviewer: null, approver: null, merger: null } as any;

    if (updatedSession.reviewStartedBy) {
      const [reviewer] = await db.select().from(users).where(eq(users.id, updatedSession.reviewStartedBy));
      if (reviewer) result.reviewer = { id: reviewer.id, name: reviewer.name, email: reviewer.email };
    }
    if (updatedSession.approvedBy) {
      const [approver] = await db.select().from(users).where(eq(users.id, updatedSession.approvedBy));
      if (approver) result.approver = { id: approver.id, name: approver.name, email: approver.email };
    }
    if (updatedSession.mergedBy) {
      const [merger] = await db.select().from(users).where(eq(users.id, updatedSession.mergedBy));
      if (merger) result.merger = { id: merger.id, name: merger.name, email: merger.email };
    }

    return c.json({ session: result });
  })

  // POST /api/sessions/:id/share - Generate share token
  .post('/:id/share', authMiddleware, async (c) => {
    const { id } = c.req.param();
    const userId = c.get('userId');

    const access = await checkSessionOwnership(id, userId);

    if (access.error === 'not_found') {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (access.error === 'access_denied') {
      return c.json({ error: 'Not authorized' }, 403);
    }

    // Generate new share token if none exists, otherwise return existing
    const shareToken = access.session!.shareToken || nanoid(12);

    const [updatedSession] = await db
      .update(sessions)
      .set({ shareToken, updatedAt: new Date() })
      .where(eq(sessions.id, id))
      .returning();

    return c.json({ shareToken: updatedSession.shareToken });
  })

  // DELETE /api/sessions/:id/share - Revoke share token
  .delete('/:id/share', authMiddleware, async (c) => {
    const { id } = c.req.param();
    const userId = c.get('userId');

    const access = await checkSessionOwnership(id, userId);

    if (access.error === 'not_found') {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (access.error === 'access_denied') {
      return c.json({ error: 'Not authorized' }, 403);
    }

    const [updatedSession] = await db
      .update(sessions)
      .set({ shareToken: null, updatedAt: new Date() })
      .where(eq(sessions.id, id))
      .returning();

    return c.json({ success: true, session: updatedSession });
  })

  // GET /api/sessions/shared/:token - Access shared session (no auth required)
  .get('/shared/:token', async (c) => {
    const { token } = c.req.param();

    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.shareToken, token))
      .limit(1);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Get files for session
    const sessionFiles = await db.select().from(files).where(eq(files.sessionId, session.id));

    return c.json({ session, files: sessionFiles });
  });
