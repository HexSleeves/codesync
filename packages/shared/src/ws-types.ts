/**
 * WebSocket message types for real-time collaboration
 * Used by both API (server) and Client
 */

// =============================================================================
// Base Types
// =============================================================================

export type WSMessageType = 'cursor' | 'presence' | 'chat' | 'error';

export interface WSMessage {
  type: WSMessageType;
}

// =============================================================================
// Server -> Client Messages
// =============================================================================

/**
 * Cursor position update from another user
 */
export interface CursorMessage extends WSMessage {
  type: 'cursor';
  userId: string;
  userName: string;
  color: string;
  fileId: string | null;
  line: number;
  column: number;
}

/**
 * Online user info
 */
export interface OnlineUser {
  userId: string;
  userName: string;
  color: string;
}

/**
 * Presence update (user joined/left)
 */
export interface PresenceMessage extends WSMessage {
  type: 'presence';
  action: 'join' | 'leave';
  userId: string;
  userName: string;
  color: string;
  onlineUsers: OnlineUser[];
}

/**
 * Chat message from the server
 */
export interface WSChatMessage extends WSMessage {
  type: 'chat';
  id: string;
  userId: string;
  userName: string;
  color: string;
  text: string;
  createdAt: string;
}

/**
 * Error message from the server
 */
export interface ErrorMessage extends WSMessage {
  type: 'error';
  code: string;
  message: string;
}

/**
 * Union of all server -> client messages
 */
export type ServerMessage = CursorMessage | PresenceMessage | WSChatMessage | ErrorMessage;

// =============================================================================
// Client -> Server Messages
// =============================================================================

/**
 * Cursor position update from client
 */
export interface ClientCursorUpdate {
  type: 'cursor';
  fileId: string | null;
  line: number;
  column: number;
}

/**
 * Chat message from client
 */
export interface ClientChatSend {
  type: 'chat';
  text: string;
}

/**
 * Union of all client -> server messages
 */
export type ClientMessage = ClientCursorUpdate | ClientChatSend;

// =============================================================================
// WebSocket Connection Data (attached during upgrade)
// =============================================================================

export interface WSConnectionData {
  sessionId: string;
  userId: string;
  userName: string;
  color: string;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Generate consistent color from userId.
 * Shared between server and client to ensure matching colors.
 */
export function getUserColor(userId: string): string {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
