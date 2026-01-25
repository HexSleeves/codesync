/**
 * GitHub connection hook
 */

import { useCallback, useEffect, useState } from 'hono/jsx';
import { apiClient } from '../api/client';

interface GitHubStatus {
  connected: boolean;
  username: string | null;
}

export function useGitHub() {
  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiClient('/api/github/status');
      if (res.ok) {
        const data = (await res.json()) as GitHubStatus;
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch GitHub status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const connect = () => {
    // Redirect to GitHub OAuth authorize endpoint
    window.location.href = '/api/github/authorize';
  };

  const disconnect = async () => {
    try {
      const res = await apiClient('/api/github/disconnect', {
        method: 'POST',
      });
      if (res.ok) {
        setStatus({ connected: false, username: null });
      }
    } catch (err) {
      console.error('Failed to disconnect GitHub:', err);
    }
  };

  return {
    connected: status?.connected ?? false,
    username: status?.username ?? null,
    loading,
    connect,
    disconnect,
    refresh: fetchStatus,
  };
}
