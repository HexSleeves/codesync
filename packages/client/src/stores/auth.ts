/**
 * Auth store using Zustand vanilla (compatible with Hono JSX-DOM)
 */

import type { User } from '@codesync/shared';
import { createStore } from 'zustand/vanilla';
import { createStoreHook } from '../lib/store';
import { apiCall } from '../api/client';
import { resetGitHubStore } from './github';
import { resetSessionsStore } from './sessions';

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

let initState: 'idle' | 'loading' | 'done' = 'idle';

export const authStore = createStore<AuthStore>()((set) => ({
  // State
  user: null,
  loading: true,
  error: null,

  // Actions
  init: async () => {
    if (initState !== 'idle') return;
    initState = 'loading';

    try {
      const { user } = await apiCall<{ user: User }>('GET', '/auth/me');
      set({ user, loading: false, error: null });
    } catch {
      set({ user: null, loading: false, error: null });
    } finally {
      initState = 'done';
    }
  },

  login: async (email: string, password: string) => {
    set({ error: null });
    try {
      const { user } = await apiCall<{ user: User }>('POST', '/auth/login', {
        email,
        password,
      });
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
      const { user } = await apiCall<{ user: User }>('POST', '/auth/register', {
        email,
        password,
        name,
      });
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
    resetGitHubStore();
    resetSessionsStore();
    set({ user: null, loading: false, error: null });
  },

  clearError: () => set({ error: null }),
}));

/**
 * Hook to use auth store with Hono JSX-DOM
 */
export const useAuthStore = createStoreHook(authStore);

// Convenience selector hooks
export const useUser = () => useAuthStore((s) => s.user);
export const useAuthLoading = () => useAuthStore((s) => s.loading);
export const useAuthError = () => useAuthStore((s) => s.error);
