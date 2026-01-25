/**
 * Session hook - manages session data and files
 */

import type { File, Session } from '@codesync/shared';
import { useCallback, useEffect, useState } from 'hono/jsx';
import { apiCall } from '../api/client';

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
    } catch (err) {
      console.error('Failed to update session:', err);
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
      return newFile;
    } catch (err) {
      console.error('Failed to add file:', err);
    }
  };

  const markFileReviewed = async (fileId: string, reviewed: boolean) => {
    try {
      await apiCall(reviewed ? 'POST' : 'DELETE', `/files/${fileId}/reviewed`);
      setState((s) => ({
        ...s,
        files: s.files.map((f) => (f.id === fileId ? { ...f, isReviewed: reviewed } : f)),
      }));
    } catch (err) {
      console.error('Failed to mark file reviewed:', err);
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

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { sessions } = await apiCall<{ sessions: Session[] }>('GET', '/sessions');
      setSessions(sessions);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = async (data: {
    title: string;
    description?: string;
    isPublic?: boolean;
  }) => {
    try {
      const { session } = await apiCall<{ session: Session }>('POST', '/sessions', data);
      setSessions((s) => [session, ...s]);
      return session;
    } catch (err) {
      console.error('Failed to create session:', err);
      throw err;
    }
  };

  const deleteSession = async (id: string) => {
    try {
      await apiCall('DELETE', `/sessions/${id}`);
      setSessions((s) => s.filter((session) => session.id !== id));
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  return {
    sessions,
    loading,
    refetch: fetchSessions,
    createSession,
    deleteSession,
  };
}
