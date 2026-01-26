/**
 * Session hook - manages session data and files
 */

import type { File, Session } from '@codesync/shared';
import { useCallback, useEffect, useState } from 'hono/jsx';
import { apiCall } from '../api/client';
import { toast } from '@/components/ui/sonner';

interface SessionState {
  session: Session | null;
  files: File[];
  loading: boolean;
  error: string | null;
}

export function useSession(sessionId: string | undefined) {
  const [state, setState] = useState<SessionState>({
    session: null,
    files: [],
    loading: true,
    error: null,
  });

  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      setState({ session: null, files: [], loading: false, error: null });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await apiCall<{ session: Session; files: File[] }>(
        'GET',
        `/sessions/${sessionId}`
      );
      setState({
        session: data.session,
        files: data.files,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load session',
      }));
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const updateSession = async (updates: Partial<Session>) => {
    if (!sessionId) return;
    try {
      const { session } = await apiCall<{ session: Session }>(
        'PATCH',
        `/sessions/${sessionId}`,
        updates
      );
      setState((s) => ({ ...s, session }));
      toast.success('Session updated');
    } catch (err) {
      console.error('Failed to update session:', err);
      toast.error('Failed to update session');
    }
  };

  const addFile = async (file: Omit<File, 'id' | 'sessionId' | 'createdAt'>) => {
    if (!sessionId) return;
    try {
      const { file: newFile } = await apiCall<{ file: File }>(
        'POST',
        `/sessions/${sessionId}/files`,
        file
      );
      setState((s) => ({ ...s, files: [...s.files, newFile] }));
      toast.success('File added');
      return newFile;
    } catch (err) {
      console.error('Failed to add file:', err);
      toast.error('Failed to add file');
    }
  };

  const markFileReviewed = async (fileId: string, reviewed: boolean) => {
    try {
      await apiCall(reviewed ? 'POST' : 'DELETE', `/files/${fileId}/reviewed`);
      setState((s) => ({
        ...s,
        files: s.files.map((f) => (f.id === fileId ? { ...f, isReviewed: reviewed } : f)),
      }));
      toast.success(reviewed ? 'File marked as reviewed' : 'File unmarked');
    } catch (err) {
      console.error('Failed to mark file reviewed:', err);
      toast.error('Failed to update file status');
    }
  };

  return {
    session: state.session,
    files: state.files,
    loading: state.loading,
    error: state.error,
    refetch: fetchSession,
    updateSession,
    addFile,
    markFileReviewed,
  };
}

// Re-export from store for backward compatibility
export { useSessions } from '../stores/sessions';
