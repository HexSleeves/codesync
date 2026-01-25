/**
 * API Server Entry Point
 * Run with: bun src/index.ts
 */

import app from './app';
import { config } from './config';
import { cursorWebSocketHandlers } from './ws/cursors';

console.log(`\n🚀 CodeSync API starting...`);
console.log(`   Environment: ${config.nodeEnv}`);
console.log(`   Port: ${config.port}`);
console.log(`   Database: ${config.databaseUrl !== 'postgres://codesync:codesync@localhost:5432/codesync' ? 'configured' : 'using default'}\n`);

const server = Bun.serve<{ sessionId: string; userId: string }>({
  port: config.port,
  fetch: app.fetch,
  websocket: {
    open: cursorWebSocketHandlers.open,
    message: cursorWebSocketHandlers.message,
    close: cursorWebSocketHandlers.close,
  },
});

console.log(`✅ Server running at http://localhost:${server.port}`);
console.log(`   API: http://localhost:${server.port}/api`);
console.log(`   Health: http://localhost:${server.port}/health\n`);

// Export for type inference in client
export type { AppType } from './app';
