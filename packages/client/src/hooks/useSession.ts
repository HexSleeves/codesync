/**
 * Session hook - manages session data and files
 * Uses TanStack Query for server state
 */

import type { File, Session } from '@codesync/shared';
import { toast } from '@/components/ui/sonner';
import { apiCall } from '../api/client';
import { invalidateQueries, queryClient, useMutation, useQuery } from '../lib/query';

export function useSession(sessionId: string | undefined) {
  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      return apiCall<{ session: Session; files: File[] }>('GET', `/sessions/${sessionId}`);
    },
    enabled: !!sessionId,
  });

  const updateSessionMutation = useMutation({
    mutationFn: async (updates: Partial<Session>) => {
      if (!sessionId) throw new Error('No session ID');
      return apiCall<{ session: Session }>('PATCH', `/sessions/${sessionId}`, updates);
    },
    onSuccess: async (data) => {
      // Invalidate sessions list so dashboard reflects changes
      await invalidateQueries(['sessions']);

      // Update cache
      queryClient.setQueryData(['session', sessionId], (old: any) => ({
        ...old,
        session: data.session,
      }));
      toast.success('Session updated');
    },
    onError: () => {
      toast.error('Failed to update session');
    },
  });

  const addFileMutation = useMutation({
    mutationFn: async (file: Omit<File, 'id' | 'sessionId' | 'createdAt'>) => {
      if (!sessionId) throw new Error('No session ID');
      return apiCall<{ file: File }>('POST', `/sessions/${sessionId}/files`, file);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['session', sessionId], (old: any) => ({
        ...old,
        files: [...(old?.files || []), data.file],
      }));
      toast.success('File added');
    },
    onError: () => {
      toast.error('Failed to add file');
    },
  });

  const markFileReviewedMutation = useMutation({
    mutationFn: async ({ fileId, reviewed }: { fileId: string; reviewed: boolean }) => {
      await apiCall(reviewed ? 'POST' : 'DELETE', `/files/${fileId}/reviewed`);
      return { fileId, reviewed };
    },
    onSuccess: ({ fileId, reviewed }) => {
      queryClient.setQueryData(['session', sessionId], (old: any) => ({
        ...old,
        files: old?.files?.map((f: File) => (f.id === fileId ? { ...f, isReviewed: reviewed } : f)),
      }));
      toast.success(reviewed ? 'File marked as reviewed' : 'File unmarked');
    },
    onError: () => {
      toast.error('Failed to update file status');
    },
  });

  // Update session in cache (used by ReviewActions after status change)
  const setSession = (session: Session) => {
    // Update current session cache
    queryClient.setQueryData(['session', sessionId], (old: any) => ({
      ...old,
      session,
    }));
    // Invalidate sessions list so dashboard shows updated status
    invalidateQueries(['sessions']);
  };

  return {
    loading,
    refetch,
    setSession,
    files: data?.files ?? [],
    session: data?.session ?? null,
    error: error ? String(error) : null,
    updateSession: (updates: Partial<Session>) => updateSessionMutation.mutate(updates),
    addFile: (file: Omit<File, 'id' | 'sessionId' | 'createdAt'>) => addFileMutation.mutate(file),
    markFileReviewed: (fileId: string, reviewed: boolean) =>
      markFileReviewedMutation.mutate({ fileId, reviewed }),
  };
}

// Re-export from store for backward compatibility
export { useSessions } from '../stores/sessions';
