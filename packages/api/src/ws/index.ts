/**
 * WebSocket handlers for real-time collaboration
 * Handles cursors, presence, and chat
 */

import type {
  CursorMessage,
  OnlineUser,
  WSChatMessage,
  WSConnectionData,
} from '@codesync/shared';
import type { ServerWebSocket } from 'bun';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/client';
import { chatMessages } from '../db/schema';

// =============================================================================
// Session State Management
// =============================================================================

interface SessionState {
  connections: Map<string, ServerWebSocket<WSConnectionData>>;
  cursors: Map<string, CursorMessage>;
}

const sessions = new Map<string, SessionState>();

/**
 * Get or create session state
 */
function getSession(sessionId: string): SessionState {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      connections: new Map(),
      cursors: new Map(),
    });
  }
  return sessions.get(sessionId)!;
}

/**
 * Generate consistent color from userId
 */
export function getUserColor(userId: string): string {
  const colors = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// =============================================================================
// Broadcasting Helpers
// =============================================================================

/**
 * Broadcast message to all connections in session except one
 */
function broadcast(
  sessionId: string,
  message: object,
  excludeUserId?: string
): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  const json = JSON.stringify(message);
  for (const [odId, ws] of session.connections) {
    if (odId !== excludeUserId && ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  }
}

/**
 * Broadcast message to ALL connections in session (including sender)
 */
function broadcastAll(sessionId: string, message: object): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  const json = JSON.stringify(message);
  for (const ws of session.connections.values()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  }
}

/**
 * Get list of online users in a session
 */
function getOnlineUsers(session: SessionState): OnlineUser[] {
  return Array.from(session.connections.values()).map((conn) => ({
    userId: conn.data.userId,
    userName: conn.data.userName,
    color: conn.data.color,
  }));
}

// =============================================================================
// WebSocket Handlers
// =============================================================================

export const wsHandlers = {
  /**
   * Called when a WebSocket connection is opened
   */
  open(ws: ServerWebSocket<WSConnectionData>): void {
    const { sessionId, userId, userName, color } = ws.data;
    const session = getSession(sessionId);

    // Add this connection
    session.connections.set(userId, ws);

    // Get current online users (including the new one)
    const onlineUsers = getOnlineUsers(session);

    // Send presence info to the new user
    ws.send(
      JSON.stringify({
        type: 'presence',
        action: 'join',
        userId,
        userName,
        color,
        onlineUsers,
      })
    );

    // Send existing cursor positions to the new user
    for (const cursor of session.cursors.values()) {
      ws.send(JSON.stringify(cursor));
    }

    // Notify other users that someone joined
    broadcast(
      sessionId,
      {
        type: 'presence',
        action: 'join',
        userId,
        userName,
        color,
        onlineUsers,
      },
      userId
    );

    console.log(`[WS] User ${userName} joined session ${sessionId}`);
  },

  /**
   * Called when a message is received
   */
  async message(
    ws: ServerWebSocket<WSConnectionData>,
    message: string | Buffer
  ): Promise<void> {
    const { sessionId, userId, userName, color } = ws.data;

    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case 'cursor': {
          const cursorMsg: CursorMessage = {
            type: 'cursor',
            userId,
            userName,
            color,
            fileId: data.fileId,
            line: data.line,
            column: data.column,
          };

          // Store cursor position
          const session = getSession(sessionId);
          session.cursors.set(userId, cursorMsg);

          // Broadcast to others (not back to sender)
          broadcast(sessionId, cursorMsg, userId);
          break;
        }

        case 'chat': {
          if (!data.text || typeof data.text !== 'string') {
            ws.send(
              JSON.stringify({
                type: 'error',
                code: 'invalid_message',
                message: 'Chat message text is required',
              })
            );
            return;
          }

          // Save to database
          const [msg] = await db
            .insert(chatMessages)
            .values({
              id: nanoid(),
              sessionId,
              authorId: userId,
              text: data.text.trim(),
            })
            .returning();

          // Broadcast to all (including sender for confirmation)
          const chatMsg: WSChatMessage = {
            type: 'chat',
            id: msg.id,
            userId,
            userName,
            color,
            text: msg.text,
            createdAt: msg.createdAt.toISOString(),
          };
          broadcastAll(sessionId, chatMsg);
          break;
        }

        default:
          ws.send(
            JSON.stringify({
              type: 'error',
              code: 'unknown_type',
              message: `Unknown message type: ${data.type}`,
            })
          );
      }
    } catch (err) {
      console.error('[WS] Message error:', err);
      ws.send(
        JSON.stringify({
          type: 'error',
          code: 'invalid_message',
          message: 'Invalid message format',
        })
      );
    }
  },

  /**
   * Called when a WebSocket connection is closed
   */
  close(ws: ServerWebSocket<WSConnectionData>): void {
    const { sessionId, userId, userName, color } = ws.data;
    const session = sessions.get(sessionId);

    if (session) {
      // Remove connection and cursor
      session.connections.delete(userId);
      session.cursors.delete(userId);

      if (session.connections.size === 0) {
        // Clean up empty session
        sessions.delete(sessionId);
      } else {
        // Notify remaining users
        const onlineUsers = getOnlineUsers(session);
        broadcast(sessionId, {
          type: 'presence',
          action: 'leave',
          userId,
          userName,
          color,
          onlineUsers,
        });
      }
    }

    console.log(`[WS] User ${userName} left session ${sessionId}`);
  },
};

// Export for backwards compatibility
export { wsHandlers as cursorWebSocketHandlers };
