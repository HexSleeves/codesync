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

  // Use single combined selector to avoid multiple subscriptions
  const { connected, username, loading } = useGitHubStore((s) => ({
    connected: s.connected,
    username: s.username,
    loading: s.loading,
  }));

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
