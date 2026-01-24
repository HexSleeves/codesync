/**
 * File routes - CRUD for files in a session
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/client';
import { files, sessions } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { createFileSchema, updateFileSchema } from '@codesync/shared';
import { authMiddleware, type AuthVariables } from '../middleware/auth';

export const fileRoutes = new Hono<{ Variables: AuthVariables }>()
  // GET /api/sessions/:sessionId/files - List files for session
  .get('/sessions/:sessionId/files', authMiddleware, async (c) => {
    const { sessionId } = c.req.param();

    const sessionFiles = await db
      .select()
      .from(files)
      .where(eq(files.sessionId, sessionId));

    return c.json({ files: sessionFiles });
  })

  // POST /api/sessions/:sessionId/files - Add file to session
  .post('/sessions/:sessionId/files', authMiddleware, zValidator('json', createFileSchema), async (c) => {
    const { sessionId } = c.req.param();
    const userId = c.get('userId');
    const data = c.req.valid('json');

    // Verify session exists and user has access
    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1)
      .then(rows => rows[0]);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (session.createdBy !== userId && !session.isPublic) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    const [file] = await db
      .insert(files)
      .values({
        ...data,
        sessionId,
      })
      .returning();

    return c.json({ file }, 201);
  })

  // GET /api/files/:id - Get file by ID
  .get('/files/:id', authMiddleware, async (c) => {
    const { id } = c.req.param();

    const file = await db
      .select()
      .from(files)
      .where(eq(files.id, id))
      .limit(1)
      .then(rows => rows[0]);

    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }

    return c.json({ file });
  })

  // PATCH /api/files/:id - Update file
  .patch('/files/:id', authMiddleware, zValidator('json', updateFileSchema), async (c) => {
    const { id } = c.req.param();
    const data = c.req.valid('json');

    const [file] = await db
      .update(files)
      .set(data)
      .where(eq(files.id, id))
      .returning();

    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }

    return c.json({ file });
  })

  // DELETE /api/files/:id - Delete file
  .delete('/files/:id', authMiddleware, async (c) => {
    const { id } = c.req.param();

    await db.delete(files).where(eq(files.id, id));

    return c.json({ success: true });
  })

  // POST /api/files/:id/reviewed - Mark file as reviewed
  .post('/files/:id/reviewed', authMiddleware, async (c) => {
    const { id } = c.req.param();

    const [file] = await db
      .update(files)
      .set({ isReviewed: true })
      .where(eq(files.id, id))
      .returning();

    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }

    return c.json({ file });
  })

  // DELETE /api/files/:id/reviewed - Unmark file as reviewed
  .delete('/files/:id/reviewed', authMiddleware, async (c) => {
    const { id } = c.req.param();

    const [file] = await db
      .update(files)
      .set({ isReviewed: false })
      .where(eq(files.id, id))
      .returning();

    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }

    return c.json({ file });
  });
