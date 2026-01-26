/**
 * GitHub store using Zustand vanilla (compatible with Hono JSX-DOM)
 */

import { useSyncExternalStore } from 'hono/jsx';
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

export const githubStore = createStore<GitHubStore>()((set, get) => ({
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
 * Hook to use GitHub store with Hono JSX-DOM
 */
export function useGitHubStore<T>(selector: (state: GitHubStore) => T): T {
  return useSyncExternalStore(
    githubStore.subscribe,
    () => selector(githubStore.getState()),
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
