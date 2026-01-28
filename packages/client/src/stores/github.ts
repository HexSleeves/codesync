/**
 * GitHub store using Zustand vanilla (compatible with Hono JSX-DOM)
 */

import { useRef, useSyncExternalStore } from 'hono/jsx';
import { createStore } from 'zustand/vanilla';
import { toast } from '@/components/ui/sonner';
import { apiClient } from '../api/client';

interface GitHubState {
  connected: boolean;
  username: string | null;
  loading: boolean;
}

interface GitHubActions {
  fetchStatus: () => Promise<void>;
  connect: () => void;
  disconnect: () => Promise<void>;
}

type GitHubStore = GitHubState & GitHubActions;

let initialized = false;

export const githubStore = createStore<GitHubStore>()((set, _get) => ({
  // State
  connected: false,
  username: null,
  loading: true,

  // Actions
  fetchStatus: async () => {
    try {
      const res = await apiClient('/api/github/status');
      if (res.ok) {
        const data = (await res.json()) as { connected: boolean; username: string | null };
        set({ connected: data.connected, username: data.username, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (err) {
      console.error('Failed to fetch GitHub status:', err);
      set({ loading: false });
    }
  },

  connect: () => {
    // Redirect to GitHub OAuth authorize endpoint
    window.location.href = '/api/github/authorize';
  },

  disconnect: async () => {
    try {
      const res = await apiClient('/api/github/disconnect', {
        method: 'POST',
      });
      if (res.ok) {
        set({ connected: false, username: null });
        toast.success('GitHub account disconnected');
      } else {
        toast.error('Failed to disconnect GitHub');
      }
    } catch (err) {
      console.error('Failed to disconnect GitHub:', err);
      toast.error('Failed to disconnect GitHub');
    }
  },
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
 * Hook to use GitHub store with Hono JSX-DOM
 * Uses useSyncExternalStore for compatibility with shallow equality checking
 */
export function useGitHubStore<T>(selector: (state: GitHubStore) => T): T {
  const cache = useRef<{ value: T; hasValue: boolean }>({ value: undefined as T, hasValue: false });

  return useSyncExternalStore(
    (onStoreChange) => {
      // Create a custom subscribe that only notifies when selected value changes
      let currentValue = selector(githubStore.getState());
      return githubStore.subscribe((state) => {
        const nextValue = selector(state);
        if (!shallowEqual(currentValue, nextValue)) {
          currentValue = nextValue;
          onStoreChange();
        }
      });
    },
    () => {
      const nextValue = selector(githubStore.getState());
      if (cache.current?.hasValue && shallowEqual(cache.current.value, nextValue)) {
        return cache.current.value;
      }
      cache.current = { value: nextValue, hasValue: true };
      return nextValue;
    },
    () => selector(githubStore.getState())
  );
}

// Initialize on first import (when user is logged in)
export function initGitHubStore() {
  if (initialized) return;
  initialized = true;
  githubStore.getState().fetchStatus();
}

// Reset for logout
export function resetGitHubStore() {
  initialized = false;
  githubStore.setState({ connected: false, username: null, loading: true });
}
