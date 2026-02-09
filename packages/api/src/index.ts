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
import { checkSessionAccess } from './services/session/access';
import { getUserColor, wsHandlers } from './ws';

function extractTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  const cookies = req.headers.get('Cookie') || '';
  const tokenCookie = cookies
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('token='));

  return tokenCookie ? tokenCookie.slice('token='.length) : null;
}

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

      // Get token from auth header or cookie
      const token = extractTokenFromRequest(req);
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

        // Check session access
        const access = await checkSessionAccess(sessionId, user.id);
        if (!access.hasAccess) {
          return new Response('Forbidden - no access to this session', { status: 403 });
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

// Graceful shutdown
function shutdown() {
  console.log('\n🛑 Shutting down...');
  server.stop();
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Export for type inference in client
export type { AppType } from './app';
