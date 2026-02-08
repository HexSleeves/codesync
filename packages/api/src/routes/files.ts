/**
 * File routes - CRUD for files in a session
 */

import { createFileSchema, updateFileSchema } from '@codesync/shared';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../db/client';
import { files } from '../db/schema';
import { type AuthVariables, authMiddleware } from '../middleware/auth';
import { checkFileAccess, checkSessionAccess, checkSessionOwnership } from '../services/session/access';

export const fileRoutes = new Hono<{ Variables: AuthVariables }>()
  // GET /api/sessions/:sessionId/files - List files for session
  .get('/sessions/:sessionId/files', authMiddleware, async (c) => {
    const { sessionId } = c.req.param();
    const userId = c.get('userId');

    const access = await checkSessionAccess(sessionId, userId);
    if (access.error) {
      return c.json({ error: access.error === 'not_found' ? 'Session not found' : 'Access denied' }, access.error === 'not_found' ? 404 : 403);
    }

    const sessionFiles = await db.select().from(files).where(eq(files.sessionId, sessionId));
    return c.json({ files: sessionFiles });
  })

  // POST /api/sessions/:sessionId/files - Add file to session
  .post(
    '/sessions/:sessionId/files',
    authMiddleware,
    zValidator('json', createFileSchema),
    async (c) => {
      const { sessionId } = c.req.param();
      const userId = c.get('userId');
      const data = c.req.valid('json');

      // Only owner can add files
      const access = await checkSessionOwnership(sessionId, userId);
      if (access.error === 'not_found') {
        return c.json({ error: 'Session not found' }, 404);
      }
      if (access.error === 'access_denied') {
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
    }
  )

  // GET /api/files/:id - Get file by ID
  .get('/files/:id', authMiddleware, async (c) => {
    const { id } = c.req.param();
    const userId = c.get('userId');

    const accessCheck = await checkFileAccess(id, userId);
    if ('error' in accessCheck) {
      return c.json({ error: accessCheck.error }, accessCheck.status);
    }

    const file = await db
      .select()
      .from(files)
      .where(eq(files.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    return c.json({ file });
  })

  // PATCH /api/files/:id - Update file
  .patch('/files/:id', authMiddleware, zValidator('json', updateFileSchema), async (c) => {
    const { id } = c.req.param();
    const userId = c.get('userId');

    const data = c.req.valid('json');

    const accessCheck = await checkFileAccess(id, userId);
    if ('error' in accessCheck) {
      return c.json({ error: accessCheck.error }, accessCheck.status);
    }

    const [file] = await db.update(files).set(data).where(eq(files.id, id)).returning();

    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }

    return c.json({ file });
  })

  // DELETE /api/files/:id - Delete file
  .delete('/files/:id', authMiddleware, async (c) => {
    const { id } = c.req.param();
    const userId = c.get('userId');

    const accessCheck = await checkFileAccess(id, userId);
    if ('error' in accessCheck) {
      return c.json({ error: accessCheck.error }, accessCheck.status);
    }

    await db.delete(files).where(eq(files.id, id));
    return c.json({ success: true });
  })

  // POST /api/files/:id/reviewed - Mark file as reviewed
  .post('/files/:id/reviewed', authMiddleware, async (c) => {
    const { id } = c.req.param();
    const userId = c.get('userId');

    const accessCheck = await checkFileAccess(id, userId);
    if ('error' in accessCheck) {
      return c.json({ error: accessCheck.error }, accessCheck.status);
    }

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
    const userId = c.get('userId');

    const accessCheck = await checkFileAccess(id, userId);
    if ('error' in accessCheck) {
      return c.json({ error: accessCheck.error }, accessCheck.status);
    }

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
