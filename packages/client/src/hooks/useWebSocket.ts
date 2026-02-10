/**
 * WebSocket hook for real-time collaboration
 * Manages connection, presence, cursors, and chat
 */

import {
  getUserColor,
  type CursorMessage,
  type OnlineUser,
  type ServerMessage,
  type WSChatMessage,
} from '@codesync/shared';
import { useCallback, useEffect, useRef, useState } from 'hono/jsx';
import { toast } from '@/components/ui/sonner';
import { apiCall } from '../api/client';

// =============================================================================
// Types
// =============================================================================

interface WebSocketState {
  connected: boolean;
  onlineUsers: OnlineUser[];
  cursors: Map<string, CursorMessage>;
  chatMessages: WSChatMessage[];
  chatHistoryLoaded: boolean;
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

const HEARTBEAT_INTERVAL = 30_000; // 30s between pings
const HEARTBEAT_TIMEOUT = 10_000; // 10s to wait for pong

export function useWebSocket(sessionId: string | undefined): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const heartbeatTimeoutRef = useRef<number | null>(null);

  const [state, setState] = useState<WebSocketState>({
    connected: false,
    onlineUsers: [],
    cursors: new Map(),
    chatMessages: [],
    chatHistoryLoaded: false,
  });

  const chatHistoryLoadedRef = useRef(false);

  /**
   * Load chat history from REST API
   */
  const loadChatHistory = useCallback(async () => {
    if (!sessionId || chatHistoryLoadedRef.current) return;

    try {
      console.log('[WS] Loading chat history...');
      const data = await apiCall<{
        messages: Array<{
          id: string;
          text: string;
          createdAt: string;
          author: { id: string; name: string; email: string } | null;
        }>;
      }>('GET', `/sessions/${sessionId}/chat`);

      // Convert to WSChatMessage format
      const historyMessages: WSChatMessage[] = data.messages.map((msg) => ({
        type: 'chat' as const,
        id: msg.id,
        userId: msg.author?.id || 'unknown',
        userName: msg.author?.name || msg.author?.email || 'Unknown',
        color: getUserColor(msg.author?.id || 'unknown'),
        text: msg.text,
        createdAt: msg.createdAt,
      }));

      console.log('[WS] Loaded', historyMessages.length, 'chat messages');
      chatHistoryLoadedRef.current = true;

      setState((s) => ({
        ...s,
        chatMessages: historyMessages,
        chatHistoryLoaded: true,
      }));
    } catch (err) {
      console.error('[WS] Failed to load chat history:', err);
    }
  }, [sessionId]);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (!sessionId) return;

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Build WebSocket URL
    // Always use the same origin - Vite proxies /ws to the API server
    // This works both in development and through exe.dev proxy
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host; // Same host:port as the page
    const url = `${protocol}//${wsHost}/ws/sessions/${sessionId}`;

    console.log('[WS] Connecting to', url);

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected');
      reconnectAttempts.current = 0;

      // Clear stale presence/cursors on reconnect
      setState((s) => ({
        ...s,
        connected: true,
        onlineUsers: [],
        cursors: new Map(),
      }));

      // Start heartbeat
      startHeartbeat();

      // Load chat history on first connection
      if (!chatHistoryLoadedRef.current) {
        loadChatHistory();
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;

        switch (message.type) {
          case 'presence':
            // Batch state updates into single setState call
            setState((s) => {
              const newState = {
                ...s,
                onlineUsers: message.onlineUsers,
              };
              // If someone left, remove their cursor in the same update
              if (message.action === 'leave') {
                const cursors = new Map(s.cursors);
                cursors.delete(message.userId);
                newState.cursors = cursors;
              }
              return newState;
            });
            break;

          case 'cursor':
            setState((s) => {
              const cursors = new Map(s.cursors);
              cursors.set(message.userId, message);
              return { ...s, cursors };
            });
            break;

          case 'chat':
            setState((s) => {
              // Deduplicate: skip if this message ID was already loaded from history
              if (s.chatMessages.some((m) => m.id === message.id)) {
                return s;
              }
              const messages = [...s.chatMessages, message];
              // Cap at 500 messages to prevent unbounded memory growth
              return {
                ...s,
                chatMessages: messages.length > 500 ? messages.slice(-500) : messages,
              };
            });
            break;

          case 'error':
            console.error('[WS] Server error:', message.code, message.message);
            break;

          default:
            // Handle pong (heartbeat response) silently
            if ((message as any).type === 'pong') {
              if (heartbeatTimeoutRef.current) {
                clearTimeout(heartbeatTimeoutRef.current);
                heartbeatTimeoutRef.current = null;
              }
            }
            break;
        }
      } catch (err) {
        console.error('[WS] Failed to parse message:', err);
      }
    };

    ws.onclose = (event) => {
      console.log('[WS] Disconnected', event.code, event.reason);
      stopHeartbeat();
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
        toast.error('Connection lost. Please refresh the page.');
      }
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
    };
  }, [sessionId, loadChatHistory]);

  /**
   * Start heartbeat: send ping every 30s, expect pong within 10s
   */
  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatIntervalRef.current = window.setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
        // If no pong within timeout, connection is dead
        heartbeatTimeoutRef.current = window.setTimeout(() => {
          console.warn('[WS] Heartbeat timeout — closing connection');
          wsRef.current?.close();
        }, HEARTBEAT_TIMEOUT);
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  /**
   * Stop heartbeat timers
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  /**
   * Connect on mount, cleanup on unmount
   */
  useEffect(() => {
    connect();

    return () => {
      stopHeartbeat();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, stopHeartbeat]);

  /**
   * Reconnect on tab visibility change (e.g., laptop wake from sleep)
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if connection is dead
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          console.log('[WS] Tab visible, connection dead — reconnecting');
          reconnectAttempts.current = 0; // Reset backoff
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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
