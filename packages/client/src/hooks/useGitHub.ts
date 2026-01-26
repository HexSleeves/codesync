/**
 * GitHub connection hook - thin wrapper around Zustand store
 */

import { useEffect } from 'hono/jsx';
import { githubStore, initGitHubStore, useGitHubStore } from '../stores/github';

export function useGitHub() {
  // Initialize store on mount
  useEffect(() => {
    initGitHubStore();
  }, []);

  const connected = useGitHubStore((s) => s.connected);
  const username = useGitHubStore((s) => s.username);
  const loading = useGitHubStore((s) => s.loading);

  const { connect, disconnect, fetchStatus } = githubStore.getState();

  return {
    connected,
    username,
    loading,
    connect,
    disconnect,
    refresh: fetchStatus,
  };
}
