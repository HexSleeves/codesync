/**
 * API Server Entry Point
 * Run with: bun src/index.ts
 */

import app from './app';
import { cursorWebSocketHandlers } from './ws/cursors';

const PORT = Number.parseInt(process.env.PORT || '8000', 10);

console.log(`\n🚀 CodeSync API starting...`);
console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`   Port: ${PORT}`);
console.log(`   Database: ${process.env.DATABASE_URL ? 'configured' : 'using default'}\n`);

const server = Bun.serve<{ sessionId: string; userId: string }>({
  port: PORT,
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
