/**
 * Session routes - CRUD for code review sessions
 */

import { createSessionSchema, updateSessionSchema } from '@codesync/shared';
import { zValidator } from '@hono/zod-validator';
import { desc, eq, or } from 'drizzle-orm';
import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { db } from '../db/client';
import { files, sessionParticipants, sessions } from '../db/schema';
import { type AuthVariables, authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

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

    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Check access
    if (!session.isPublic && session.createdBy !== userId) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Get files for session
    const sessionFiles = await db.select().from(files).where(eq(files.sessionId, id));

    return c.json({ session, files: sessionFiles });
  })

  // PATCH /api/sessions/:id - Update session
  .patch('/:id', authMiddleware, zValidator('json', updateSessionSchema), async (c) => {
    const { id } = c.req.param();
    const userId = c.get('userId');
    const data = c.req.valid('json');

    // Check ownership
    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (session.createdBy !== userId) {
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

    // Check ownership
    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (session.createdBy !== userId) {
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

    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (session.createdBy !== userId) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    const [updatedSession] = await db
      .update(sessions)
      .set({ status: 'in_review', updatedAt: new Date() })
      .where(eq(sessions.id, id))
      .returning();

    return c.json({ session: updatedSession });
  })

  // POST /api/sessions/:id/review/submit - Submit review
  .post('/:id/review/submit', authMiddleware, async (c) => {
    const { id } = c.req.param();
    const _userId = c.get('userId');
    const { approved } = await c.req.json<{ approved: boolean }>();

    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    const newStatus = approved ? 'approved' : 'draft';
    const [updatedSession] = await db
      .update(sessions)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(sessions.id, id))
      .returning();

    return c.json({ session: updatedSession });
  });
