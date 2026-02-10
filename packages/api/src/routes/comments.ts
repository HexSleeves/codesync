/**
 * Comment routes - CRUD for comments on files
 */

import { createCommentSchema, updateCommentSchema } from '@codesync/shared';
import { zValidator } from '@hono/zod-validator';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { db } from '../db/client';
import { comments, users } from '../db/schema';
import { type AuthVariables, authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { checkFileAccess, checkSessionAccess } from '../services/session/access';

export const commentRoutes = new Hono<{ Variables: AuthVariables }>()
  // GET /api/sessions/:sessionId/comments - Get all comments for session (supports shared access)
  .get('/sessions/:sessionId/comments', optionalAuthMiddleware, async (c) => {
    const { sessionId } = c.req.param();
    const userId = c.get('userId');

    const access = await checkSessionAccess(sessionId, userId);

    if (access.error === 'not_found') {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (access.error === 'access_denied') {
      return c.json({ error: 'Access denied' }, 403);
    }

    const sessionComments = await db
      .select({
        comment: comments,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.sessionId, sessionId));

    return c.json({
      comments: sessionComments.map(({ comment, author }) => ({
        ...comment,
        author,
      })),
    });
  })

  // GET /api/files/:fileId/comments - Get comments for file
  .get('/files/:fileId/comments', authMiddleware, async (c) => {
    const { fileId } = c.req.param();
    const userId = c.get('userId');

    const accessCheck = await checkFileAccess(fileId, userId);
    if ('error' in accessCheck) {
      return c.json({ error: accessCheck.error }, accessCheck.status);
    }

    const fileComments = await db
      .select({
        comment: comments,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.fileId, fileId));

    return c.json({
      comments: fileComments.map(({ comment, author }) => ({
        ...comment,
        author,
      })),
    });
  })

  // POST /api/files/:fileId/comments - Add comment to file
  .post(
    '/files/:fileId/comments',
    authMiddleware,
    zValidator('json', createCommentSchema),
    async (c) => {
      const { fileId } = c.req.param();
      const userId = c.get('userId');
      const data = c.req.valid('json');

      const accessCheck = await checkFileAccess(fileId, userId);
      if ('error' in accessCheck) {
        return c.json({ error: accessCheck.error }, accessCheck.status);
      }

      let threadId = nanoid();
      if (data.parentId) {
        const parentComment = await db
          .select({
            id: comments.id,
            sessionId: comments.sessionId,
            fileId: comments.fileId,
            threadId: comments.threadId,
          })
          .from(comments)
          .where(eq(comments.id, data.parentId))
          .limit(1)
          .then((rows) => rows[0]);

        if (!parentComment) {
          return c.json({ error: 'Parent comment not found' }, 400);
        }

        if (parentComment.fileId !== fileId || parentComment.sessionId !== accessCheck.sessionId) {
          return c.json({ error: 'Parent comment must be in the same file thread' }, 400);
        }

        threadId = parentComment.threadId || parentComment.id;
      }

      const [comment] = await db
        .insert(comments)
        .values({
          ...data,
          fileId,
          sessionId: accessCheck.sessionId,
          authorId: userId,
          threadId,
        })
        .returning();

      // Get author info
      const author = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
        .then((rows) => rows[0]);

      return c.json({ comment: { ...comment, author } }, 201);
    }
  )

  // PATCH /api/comments/:id - Update comment
  .patch('/comments/:id', authMiddleware, zValidator('json', updateCommentSchema), async (c) => {
    const { id } = c.req.param();
    const userId = c.get('userId');
    const data = c.req.valid('json');

    // Check ownership
    const comment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!comment) {
      return c.json({ error: 'Comment not found' }, 404);
    }

    if (comment.authorId !== userId) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    const [updatedComment] = await db
      .update(comments)
      .set(data)
      .where(eq(comments.id, id))
      .returning();

    return c.json({ comment: updatedComment });
  })

  // DELETE /api/comments/:id - Delete comment
  .delete('/comments/:id', authMiddleware, async (c) => {
    const { id } = c.req.param();
    const userId = c.get('userId');

    // Check ownership
    const comment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!comment) {
      return c.json({ error: 'Comment not found' }, 404);
    }

    if (comment.authorId !== userId) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    await db.delete(comments).where(eq(comments.id, id));

    return c.json({ success: true });
  })

  // POST /api/comments/:id/resolve - Resolve comment thread
  .post('/comments/:id/resolve', authMiddleware, async (c) => {
    const { id } = c.req.param();
    const userId = c.get('userId');

    // Get comment to find thread
    const comment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!comment) {
      return c.json({ error: 'Comment not found' }, 404);
    }

    // Check session access
    const access = await checkSessionAccess(comment.sessionId, userId);
    if (!access.hasAccess) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Resolve all comments in thread
    if (comment.threadId) {
      await db
        .update(comments)
        .set({ isResolved: true })
        .where(
          and(
            eq(comments.threadId, comment.threadId),
            eq(comments.sessionId, comment.sessionId),
            eq(comments.fileId, comment.fileId)
          )
        );
    } else {
      await db.update(comments).set({ isResolved: true }).where(eq(comments.id, id));
    }

    return c.json({ success: true });
  })

  // DELETE /api/comments/:id/resolve - Unresolve comment thread
  .delete('/comments/:id/resolve', authMiddleware, async (c) => {
    const { id } = c.req.param();
    const userId = c.get('userId');

    const comment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!comment) {
      return c.json({ error: 'Comment not found' }, 404);
    }

    // Check session access
    const access = await checkSessionAccess(comment.sessionId, userId);
    if (!access.hasAccess) {
      return c.json({ error: 'Access denied' }, 403);
    }

    if (comment.threadId) {
      await db
        .update(comments)
        .set({ isResolved: false })
        .where(
          and(
            eq(comments.threadId, comment.threadId),
            eq(comments.sessionId, comment.sessionId),
            eq(comments.fileId, comment.fileId)
          )
        );
    } else {
      await db.update(comments).set({ isResolved: false }).where(eq(comments.id, id));
    }

    return c.json({ success: true });
  });
