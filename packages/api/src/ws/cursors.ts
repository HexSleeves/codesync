/**
 * WebSocket handler for real-time cursor positions
 */

import { Hono } from 'hono';
import type { CursorPosition } from '@codesync/shared';

// Store active connections by session
const sessionConnections = new Map<string, Set<WebSocket>>();

export const cursorWS = new Hono().get('/ws/sessions/:sessionId/cursors', (c) => {
  const sessionId = c.req.param('sessionId');
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
  return c.text('WebSocket upgrade', 101);
});

/**
 * Bun WebSocket handlers for cursor updates
 * Used when running with Bun.serve()
 */
export const cursorWebSocketHandlers = {
  open(ws: WebSocket & { data?: { sessionId: string; userId: string } }) {
    const sessionId = ws.data?.sessionId;
    if (!sessionId) return;

    if (!sessionConnections.has(sessionId)) {
      sessionConnections.set(sessionId, new Set());
    }
    sessionConnections.get(sessionId)!.add(ws);

    console.log(`User joined cursor channel: ${sessionId}`);
  },

  message(ws: WebSocket & { data?: { sessionId: string; userId: string } }, message: string | Buffer) {
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

  close(ws: WebSocket & { data?: { sessionId: string; userId: string } }) {
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
