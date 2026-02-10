/**
 * WebSocket handlers for real-time collaboration
 * Handles cursors, presence, and chat
 */

import type { CursorMessage, OnlineUser, WSChatMessage, WSConnectionData } from '@codesync/shared';
import type { ServerWebSocket } from 'bun';
import { nanoid } from 'nanoid';
import { db } from '../db/client';
import { chatMessages } from '../db/schema';

// =============================================================================
// Session State Management
// =============================================================================

interface SessionState {
  /** Map of connectionId → WebSocket */
  connections: Map<string, ServerWebSocket<WSConnectionData>>;
  /** Map of userId → Set of connectionIds (supports multi-tab) */
  userConnections: Map<string, Set<string>>;
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
      userConnections: new Map(),
      cursors: new Map(),
    });
  }
  return sessions.get(sessionId)!;
}

// =============================================================================
// Broadcasting Helpers
// =============================================================================

/**
 * Broadcast message to all connections in session except one
 */
function broadcast(sessionId: string, message: object, excludeConnId?: string): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  const json = JSON.stringify(message);
  for (const [connId, ws] of session.connections) {
    if (connId !== excludeConnId && ws.readyState === WebSocket.OPEN) {
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
  // Deduplicate by userId (user may have multiple tabs)
  const seen = new Set<string>();
  const result: OnlineUser[] = [];
  for (const ws of session.connections.values()) {
    if (!seen.has(ws.data.userId)) {
      seen.add(ws.data.userId);
      result.push({
        userId: ws.data.userId,
        userName: ws.data.userName,
        color: ws.data.color,
      });
    }
  }
  return result;
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

    // Generate unique connection ID for multi-tab support
    const connId = nanoid(8);
    (ws.data as any).connId = connId;

    // Add this connection
    session.connections.set(connId, ws);
    if (!session.userConnections.has(userId)) {
      session.userConnections.set(userId, new Set());
    }
    session.userConnections.get(userId)!.add(connId);

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
      connId
    );

    console.log(`[WS] User ${userName} joined session ${sessionId}`);
  },

  /**
   * Called when a message is received
   */
  async message(ws: ServerWebSocket<WSConnectionData>, message: string | Buffer): Promise<void> {
    const { sessionId, userId, userName, color } = ws.data;
    const connId = (ws.data as any).connId as string;

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
          broadcast(sessionId, cursorMsg, connId);
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

          const text = data.text.trim();
          if (text.length > 2000) {
            ws.send(
              JSON.stringify({
                type: 'error',
                code: 'message_too_long',
                message: 'Chat message must be 2000 characters or less',
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
              text,
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

        case 'ping': {
          // Client-level heartbeat: respond with pong
          ws.send(JSON.stringify({ type: 'pong' }));
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
    const connId = (ws.data as any).connId as string;
    const session = sessions.get(sessionId);

    if (session) {
      // Remove this specific connection
      session.connections.delete(connId);
      const userConns = session.userConnections.get(userId);
      if (userConns) {
        userConns.delete(connId);
        if (userConns.size === 0) {
          session.userConnections.delete(userId);
          // Only remove cursor when ALL tabs are closed
          session.cursors.delete(userId);
        }
      }

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
