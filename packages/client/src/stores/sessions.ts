/**
 * Sessions store using Zustand vanilla (compatible with Hono JSX-DOM)
 * Manages the list of user's sessions
 */

import type { Session } from '@codesync/shared';
import { useSyncExternalStore } from 'hono/jsx';
import { createStore } from 'zustand/vanilla';
import { toast } from '@/components/ui/sonner';
import { apiCall } from '../api/client';

interface SessionsState {
  sessions: Session[];
  loading: boolean;
}

interface SessionsActions {
  fetchSessions: () => Promise<void>;
  createSession: (data: {
    title: string;
    description?: string;
    isPublic?: boolean;
  }) => Promise<Session | undefined>;
  deleteSession: (id: string) => Promise<void>;
  addSession: (session: Session) => void;
}

type SessionsStore = SessionsState & SessionsActions;

let initialized = false;

export const sessionsStore = createStore<SessionsStore>()((set, _get) => ({
  // State
  sessions: [],
  loading: true,

  // Actions
  fetchSessions: async () => {
    set({ loading: true });
    try {
      const { sessions } = await apiCall<{ sessions: Session[] }>('GET', '/sessions');
      set({ sessions, loading: false });
    } catch (err) {
      console.error('Failed to load sessions:', err);
      toast.error('Failed to load sessions');
      set({ loading: false });
    }
  },

  createSession: async (data) => {
    try {
      const { session } = await apiCall<{ session: Session }>('POST', '/sessions', data);
      set((s) => ({ sessions: [session, ...s.sessions] }));
      toast.success('Session created');
      return session;
    } catch (err) {
      console.error('Failed to create session:', err);
      toast.error('Failed to create session');
      throw err;
    }
  },

  deleteSession: async (id) => {
    try {
      await apiCall('DELETE', `/sessions/${id}`);
      set((s) => ({ sessions: s.sessions.filter((session) => session.id !== id) }));
      toast.success('Session deleted');
    } catch (err) {
      console.error('Failed to delete session:', err);
      toast.error('Failed to delete session');
    }
  },

  // Add a session to the list (e.g., after GitHub import)
  addSession: (session) => {
    set((s) => ({ sessions: [session, ...s.sessions] }));
  },
}));

/**
 * Hook to use sessions store with Hono JSX-DOM
 */
export function useSessionsStore<T>(selector: (state: SessionsStore) => T): T {
  return useSyncExternalStore(
    sessionsStore.subscribe,
    () => selector(sessionsStore.getState()),
    () => selector(sessionsStore.getState())
  );
}

// Initialize on first use
export function initSessionsStore() {
  if (initialized) return;
  initialized = true;
  sessionsStore.getState().fetchSessions();
}

// Reset for logout
export function resetSessionsStore() {
  initialized = false;
  sessionsStore.setState({ sessions: [], loading: true });
}

/**
 * Convenience hook matching the old useSessions API
 */
export function useSessions() {
  // Initialize on mount
  initSessionsStore();

  const sessions = useSessionsStore((s) => s.sessions);
  const loading = useSessionsStore((s) => s.loading);

  const { fetchSessions, createSession, deleteSession } = sessionsStore.getState();

  return {
    sessions,
    loading,
    refetch: fetchSessions,
    createSession,
    deleteSession,
  };
}
