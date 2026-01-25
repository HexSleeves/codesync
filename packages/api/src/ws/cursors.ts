/**
 * WebSocket handler for real-time cursor positions
 */

import type { CursorPosition } from '@codesync/shared';
import type { ServerWebSocket } from 'bun';
import { Hono } from 'hono';

// WebSocket data attached during upgrade
interface WSData {
  sessionId: string;
  userId: string;
}

// Store active connections by session
const sessionConnections = new Map<string, Set<ServerWebSocket<WSData>>>();

export const cursorWS = new Hono().get('/ws/sessions/:sessionId/cursors', (c) => {
  const _sessionId = c.req.param('sessionId');
  const upgradeHeader = c.req.header('Upgrade');

  if (upgradeHeader !== 'websocket') {
    return c.text('Expected websocket', 426);
  }

  // Bun's native WebSocket upgrade
  const server = (globalThis as { Bun?: { serve: unknown } }).Bun;
  if (!server) {
    return c.text('WebSocket not supported', 500);
  }

  // This will be handled by Bun's WebSocket handler
  return new Response(null, { status: 101, statusText: 'Switching Protocols' });
});

/**
 * Bun WebSocket handlers for cursor updates
 * Used when running with Bun.serve()
 */
export const cursorWebSocketHandlers = {
  open(ws: ServerWebSocket<WSData>) {
    const sessionId = ws.data?.sessionId;
    if (!sessionId) return;

    if (!sessionConnections.has(sessionId)) {
      sessionConnections.set(sessionId, new Set());
    }
    sessionConnections.get(sessionId)!.add(ws);

    console.log(`User joined cursor channel: ${sessionId}`);
  },

  message(ws: ServerWebSocket<WSData>, message: string | Buffer) {
    const sessionId = ws.data?.sessionId;
    if (!sessionId) return;

    const data = JSON.parse(message.toString()) as CursorPosition;

    // Broadcast to all other connections in the session
    const connections = sessionConnections.get(sessionId);
    if (connections) {
      for (const conn of connections) {
        if (conn !== ws && conn.readyState === WebSocket.OPEN) {
          conn.send(JSON.stringify(data));
        }
      }
    }
  },

  close(ws: ServerWebSocket<WSData>) {
    const sessionId = ws.data?.sessionId;
    if (!sessionId) return;

    const connections = sessionConnections.get(sessionId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        sessionConnections.delete(sessionId);
      }
    }

    console.log(`User left cursor channel: ${sessionId}`);
  },
};
