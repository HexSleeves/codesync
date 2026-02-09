/**
 * Main Hono application with all routes
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';

import { config } from './config';
import { authRoutes } from './routes/auth';
import { chatRoutes } from './routes/chat';
import { commentRoutes } from './routes/comments';
import { fileRoutes } from './routes/files';
import { githubRoutes } from './routes/github/index';
import { sessionRoutes } from './routes/sessions';

// WebSocket handling is done in index.ts via Bun.serve()

const app = new Hono()
  // Global middleware
  .use('*', logger())
  .use('*', prettyJSON())
  .use('*', secureHeaders())
  .use(
    '*',
    cors({
      origin: config.corsOrigin,
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

  // 404 handler
  .notFound((c) => c.json({ error: 'Not found' }, 404))

  // Error handler
  .onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json({ error: err.message || 'Request failed' }, err.status);
    }

    console.error('Error:', err);

    if (!config.isDev) {
      return c.json({ error: 'Internal server error' }, 500);
    }

    return c.json(
      {
        error: err.message || 'Internal server error',
        stack: err.stack,
      },
      500
    );
  });

export type AppType = typeof app;
export default app;
