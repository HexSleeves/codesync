/**
 * Auth store using Zustand vanilla (compatible with Hono JSX-DOM)
 */

import type { User } from '@codesync/shared';
import { useSyncExternalStore } from 'hono/jsx';
import { createStore } from 'zustand/vanilla';
import { apiCall, clearToken, getToken, setToken } from '../api/client';
import { resetGitHubStore } from './github';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

let initialized = false;

export const authStore = createStore<AuthStore>()((set) => ({
  // State
  user: null,
  loading: true,
  error: null,

  // Actions
  init: async () => {
    if (initialized) return;
    initialized = true;

    const token = getToken();
    if (!token) {
      set({ user: null, loading: false, error: null });
      return;
    }

    try {
      const { user } = await apiCall<{ user: User }>('GET', '/auth/me');
      set({ user, loading: false, error: null });
    } catch {
      clearToken();
      set({ user: null, loading: false, error: null });
    }
  },

  login: async (email: string, password: string) => {
    set({ error: null });
    try {
      const { user, token } = await apiCall<{ user: User; token: string }>('POST', '/auth/login', {
        email,
        password,
      });
      setToken(token);
      set({ user, loading: false, error: null });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ error: message });
      return { success: false, error: message };
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ error: null });
    try {
      const { user, token } = await apiCall<{ user: User; token: string }>(
        'POST',
        '/auth/register',
        {
          email,
          password,
          name,
        }
      );
      setToken(token);
      set({ user, loading: false, error: null });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      set({ error: message });
      return { success: false, error: message };
    }
  },

  logout: async () => {
    await apiCall('POST', '/auth/logout').catch(() => {});
    clearToken();
    resetGitHubStore();
    set({ user: null, loading: false, error: null });
  },

  clearError: () => set({ error: null }),
}));

/**
 * Hook to use auth store with Hono JSX-DOM
 * Uses useSyncExternalStore for compatibility
 */
export function useAuthStore<T>(selector: (state: AuthStore) => T): T {
  return useSyncExternalStore(
    authStore.subscribe,
    () => selector(authStore.getState()),
    () => selector(authStore.getState())
  );
}

// Convenience selector hooks
export const useUser = () => useAuthStore((s) => s.user);
export const useAuthLoading = () => useAuthStore((s) => s.loading);
export const useAuthError = () => useAuthStore((s) => s.error);
