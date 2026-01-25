/**
 * API Server Entry Point
 * Run with: bun src/index.ts
 */

import type { WSConnectionData } from '@codesync/shared';
import { eq } from 'drizzle-orm';
import { verify } from 'hono/jwt';
import app from './app';
import { config } from './config';
import { db } from './db/client';
import { users } from './db/schema';
import { getUserColor, wsHandlers } from './ws';

console.log(`\n🚀 CodeSync API starting...`);
console.log(`   Environment: ${config.nodeEnv}`);
console.log(`   Port: ${config.port}`);
console.log(
  `   Database: ${config.databaseUrl !== 'postgres://codesync:codesync@localhost:5432/codesync' ? 'configured' : 'using default'}\n`
);

const server = Bun.serve<WSConnectionData>({
  port: config.port,

  /**
   * Handle HTTP requests and WebSocket upgrades
   */
  async fetch(req, server) {
    const url = new URL(req.url);

    // WebSocket upgrade for /ws/sessions/:sessionId
    if (url.pathname.startsWith('/ws/sessions/')) {
      const pathParts = url.pathname.split('/');
      const sessionId = pathParts[3];

      if (!sessionId) {
        return new Response('Session ID required', { status: 400 });
      }

      // Get token from query string
      const token = url.searchParams.get('token');
      if (!token) {
        return new Response('Unauthorized - token required', { status: 401 });
      }

      try {
        // Verify JWT
        const payload = (await verify(token, config.jwtSecret, 'HS256')) as {
          sub?: string;
        };

        if (!payload?.sub) {
          return new Response('Unauthorized - invalid token', { status: 401 });
        }

        // Fetch user from database
        const user = await db.query.users.findFirst({
          where: eq(users.id, payload.sub),
        });

        if (!user) {
          return new Response('Unauthorized - user not found', { status: 401 });
        }

        // Upgrade to WebSocket with user data attached
        const upgraded = server.upgrade(req, {
          data: {
            sessionId,
            userId: user.id,
            userName: user.name || user.email.split('@')[0],
            color: getUserColor(user.id),
          } satisfies WSConnectionData,
        });

        if (upgraded) {
          // Bun handles the response for successful upgrades
          return undefined;
        }

        return new Response('WebSocket upgrade failed', { status: 500 });
      } catch (err) {
        console.error('[WS] Auth error:', err);
        return new Response('Unauthorized - auth failed', { status: 401 });
      }
    }

    // All other requests go to Hono app
    return app.fetch(req);
  },

  // WebSocket handlers
  websocket: wsHandlers,
});

console.log(`✅ Server running at http://localhost:${server.port}`);
console.log(`   API: http://localhost:${server.port}/api`);
console.log(`   Health: http://localhost:${server.port}/health`);
console.log(`   WebSocket: ws://localhost:${server.port}/ws/sessions/:id\n`);

// Export for type inference in client
export type { AppType } from './app';
