/**
 * Main Hono application with all routes
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';

import { authRoutes } from './routes/auth';
import { chatRoutes } from './routes/chat';
import { commentRoutes } from './routes/comments';
import { fileRoutes } from './routes/files';
import { githubRoutes } from './routes/github';
import { sessionRoutes } from './routes/sessions';
import { cursorWS } from './ws/cursors';

const app = new Hono()
  // Global middleware
  .use('*', logger())
  .use('*', prettyJSON())
  .use('*', secureHeaders())
  .use(
    '*',
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    })
  )

  // Health check
  .get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

  // API routes
  .route('/api/auth', authRoutes)
  .route('/api/sessions', sessionRoutes)
  .route('/api', fileRoutes)
  .route('/api', commentRoutes)
  .route('/api', chatRoutes)
  .route('/api/github', githubRoutes)

  // WebSocket routes
  .route('/', cursorWS)

  // 404 handler
  .notFound((c) => c.json({ error: 'Not found' }, 404))

  // Error handler
  .onError((err, c) => {
    console.error('Error:', err);
    return c.json(
      {
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
      500
    );
  });

export type AppType = typeof app;
export default app;
