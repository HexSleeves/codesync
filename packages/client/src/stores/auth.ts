/**
 * Auth store using Zustand vanilla (compatible with Hono JSX-DOM)
 */

import type { User } from '@codesync/shared';
import { useRef, useSyncExternalStore } from 'hono/jsx';
import { createStore } from 'zustand/vanilla';
import { apiCall, clearToken, getToken, setToken } from '../api/client';
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
    resetSessionsStore();
    set({ user: null, loading: false, error: null });
  },

  clearError: () => set({ error: null }),
}));

/**
 * Shallow equality check for store selectors
 */
function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }
  const keysA = Object.keys(a) as Array<keyof T>;
  const keysB = Object.keys(b) as Array<keyof T>;
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!keysB.includes(key) || !Object.is(a[key], b[key])) {
      return false;
    }
  }
  return true;
}

/**
 * Hook to use auth store with Hono JSX-DOM
 * Uses useSyncExternalStore for compatibility with shallow equality checking
 */
export function useAuthStore<T>(selector: (state: AuthStore) => T): T {
  const cache = useRef<{ value: T; hasValue: boolean }>({ value: undefined as T, hasValue: false });

  return useSyncExternalStore(
    (onStoreChange) => {
      // Create a custom subscribe that only notifies when selected value changes
      let currentValue = selector(authStore.getState());
      return authStore.subscribe((state) => {
        const nextValue = selector(state);
        if (!shallowEqual(currentValue, nextValue)) {
          currentValue = nextValue;
          onStoreChange();
        }
      });
    },
    () => {
      const nextValue = selector(authStore.getState());
      const cached = cache.current;
      if (cached?.hasValue && shallowEqual(cached.value, nextValue)) {
        return cached.value;
      }
      cache.current = { value: nextValue, hasValue: true };
      return nextValue;
    },
    () => selector(authStore.getState())
  );
}

// Convenience selector hooks
export const useUser = () => useAuthStore((s) => s.user);
export const useAuthLoading = () => useAuthStore((s) => s.loading);
export const useAuthError = () => useAuthStore((s) => s.error);
