/**
 * Chat routes - Messages in a session
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/client';
import { chatMessages, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { sendChatMessageSchema } from '@codesync/shared';
import { authMiddleware, type AuthVariables } from '../middleware/auth';

export const chatRoutes = new Hono<{ Variables: AuthVariables }>()
  // GET /api/sessions/:sessionId/chat - Get chat messages
  .get('/sessions/:sessionId/chat', authMiddleware, async (c) => {
    const { sessionId } = c.req.param();
    const limit = parseInt(c.req.query('limit') || '100');

    const messages = await db
      .select({
        message: chatMessages,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.authorId, users.id))
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);

    return c.json({
      messages: messages
        .map(({ message, author }) => ({
          ...message,
          author,
        }))
        .reverse(),
    });
  })

  // POST /api/sessions/:sessionId/chat - Send chat message
  .post('/sessions/:sessionId/chat', authMiddleware, zValidator('json', sendChatMessageSchema), async (c) => {
    const { sessionId } = c.req.param();
    const userId = c.get('userId');
    const { text } = c.req.valid('json');

    const [message] = await db
      .insert(chatMessages)
      .values({
        sessionId,
        authorId: userId,
        text,
      })
      .returning();

    // Get author info
    const author = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then(rows => rows[0]);

    return c.json({ message: { ...message, author } }, 201);
  });
