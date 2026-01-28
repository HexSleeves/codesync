/**
 * Hook for GitHub review sync functionality
 * Manages submitting reviews to GitHub and tracking sync status
 */

import { useCallback, useEffect, useState } from 'hono/jsx';
import { apiCall } from '@/api/client';

interface SyncStatus {
  isGitHubSession: boolean;
  githubReviewId: string | null;
  lastSyncedAt: Date | null;
  totalComments: number;
  syncedComments: number;
  unsyncedComments: number;
  canSync: boolean;
}

interface UseGitHubSyncReturn {
  /** Current sync status */
  syncStatus: SyncStatus | null;
  /** Whether we're fetching sync status */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh the sync status */
  refresh: () => Promise<void>;
}

/**
 * Hook to manage GitHub review sync status
 */
export function useGitHubSync(sessionId: string): UseGitHubSyncReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSyncStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const status = await apiCall<SyncStatus>('GET', `/github/sessions/${sessionId}/sync-status`);
      setSyncStatus({
        ...status,
        lastSyncedAt: status.lastSyncedAt ? new Date(status.lastSyncedAt) : null,
      });
    } catch (err) {
      console.error('Failed to fetch sync status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sync status');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  return {
    syncStatus,
    loading,
    error,
    refresh: fetchSyncStatus,
  };
}
