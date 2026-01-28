/**
 * Sessions hooks using TanStack Query
 * Manages the list of user's sessions
 */

import type { Session } from '@codesync/shared';
import { toast } from '@/components/ui/sonner';
import { apiCall } from '../api/client';
import { queryClient, useMutation, useQuery } from '../lib/query';

/**
 * Hook to fetch and manage user's sessions list
 */
export function useSessions() {
  const {
    data,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      return apiCall<{ sessions: Session[] }>('GET', '/sessions');
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string; isPublic?: boolean }) => {
      return apiCall<{ session: Session }>('POST', '/sessions', data);
    },
    onSuccess: (result) => {
      // Add to cache
      queryClient.setQueryData(['sessions'], (old: { sessions: Session[] } | undefined) => ({
        sessions: [result.session, ...(old?.sessions || [])],
      }));
      toast.success('Session created');
    },
    onError: () => {
      toast.error('Failed to create session');
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiCall('DELETE', `/sessions/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.setQueryData(['sessions'], (old: { sessions: Session[] } | undefined) => ({
        sessions: old?.sessions.filter((s) => s.id !== deletedId) || [],
      }));
      toast.success('Session deleted');
    },
    onError: () => {
      toast.error('Failed to delete session');
    },
  });

  return {
    sessions: data?.sessions ?? [],
    loading,
    refetch,
    createSession: async (data: { title: string; description?: string; isPublic?: boolean }) => {
      const result = await createSessionMutation.mutateAsync(data);
      return result.session;
    },
    deleteSession: (id: string) => deleteSessionMutation.mutate(id),
  };
}

/**
 * Reset sessions cache (called on logout)
 */
export function resetSessionsStore() {
  queryClient.removeQueries({ queryKey: ['sessions'] });
}
