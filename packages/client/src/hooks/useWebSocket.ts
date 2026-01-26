/**
 * WebSocket hook for real-time collaboration
 * Manages connection, presence, cursors, and chat
 */

import type { CursorMessage, OnlineUser, ServerMessage, WSChatMessage } from '@codesync/shared';
import { useCallback, useEffect, useRef, useState } from 'hono/jsx';
import { getToken } from '../api/client';

// =============================================================================
// Types
// =============================================================================

interface WebSocketState {
  connected: boolean;
  onlineUsers: OnlineUser[];
  cursors: Map<string, CursorMessage>;
  chatMessages: WSChatMessage[];
}

interface UseWebSocketReturn {
  connected: boolean;
  onlineUsers: OnlineUser[];
  cursors: Map<string, CursorMessage>;
  chatMessages: WSChatMessage[];
  sendCursor: (fileId: string | null, line: number, column: number) => void;
  sendChat: (text: string) => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useWebSocket(sessionId: string | undefined): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);

  const [state, setState] = useState<WebSocketState>({
    connected: false,
    onlineUsers: [],
    cursors: new Map(),
    chatMessages: [],
  });

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (!sessionId) return;

    const token = getToken();
    if (!token) {
      console.warn('[WS] No auth token available');
      return;
    }

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Build WebSocket URL
    // Always use the same origin - Vite proxies /ws to the API server
    // This works both in development and through exe.dev proxy
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host; // Same host:port as the page
    const url = `${protocol}//${wsHost}/ws/sessions/${sessionId}?token=${token}`;

    console.log('[WS] Connecting to', url.replace(/token=.*/, 'token=***'));

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected');
      reconnectAttempts.current = 0;
      setState((s) => ({ ...s, connected: true }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;

        switch (message.type) {
          case 'presence':
            setState((s) => ({
              ...s,
              onlineUsers: message.onlineUsers,
            }));
            // If someone left, remove their cursor
            if (message.action === 'leave') {
              setState((s) => {
                const cursors = new Map(s.cursors);
                cursors.delete(message.userId);
                return { ...s, cursors };
              });
            }
            break;

          case 'cursor':
            setState((s) => {
              const cursors = new Map(s.cursors);
              cursors.set(message.userId, message);
              return { ...s, cursors };
            });
            break;

          case 'chat':
            setState((s) => ({
              ...s,
              chatMessages: [...s.chatMessages, message],
            }));
            break;

          case 'error':
            console.error('[WS] Server error:', message.code, message.message);
            break;
        }
      } catch (err) {
        console.error('[WS] Failed to parse message:', err);
      }
    };

    ws.onclose = (event) => {
      console.log('[WS] Disconnected', event.code, event.reason);
      setState((s) => ({ ...s, connected: false }));

      // Reconnect with exponential backoff
      const attempts = reconnectAttempts.current ?? 0;
      if (attempts < 5) {
        const delay = Math.min(1000 * 2 ** attempts, 30000);
        console.log(`[WS] Reconnecting in ${delay}ms...`);
        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectAttempts.current = attempts + 1;
          connect();
        }, delay);
      } else {
        console.warn('[WS] Max reconnection attempts reached');
      }
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
    };
  }, [sessionId]);

  /**
   * Connect on mount, cleanup on unmount
   */
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  /**
   * Send cursor position update
   */
  const sendCursor = useCallback((fileId: string | null, line: number, column: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'cursor',
          fileId,
          line,
          column,
        })
      );
    }
  }, []);

  /**
   * Send chat message
   */
  const sendChat = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && text.trim()) {
      wsRef.current.send(
        JSON.stringify({
          type: 'chat',
          text: text.trim(),
        })
      );
    }
  }, []);

  return {
    connected: state.connected,
    onlineUsers: state.onlineUsers,
    cursors: state.cursors,
    chatMessages: state.chatMessages,
    sendCursor,
    sendChat,
  };
}
