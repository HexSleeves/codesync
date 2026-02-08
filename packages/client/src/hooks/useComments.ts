/**
 * Comments hook - manages file comments
 * Uses TanStack Query for server state
 */

import type { Comment } from '@codesync/shared';
import { useCallback, useMemo } from 'hono/jsx';
import { toast } from '@/components/ui/sonner';
import { apiCall } from '../api/client';
import { queryClient, useMutation, useQuery } from '../lib/query';

export function useComments(fileId: string | null) {
  const {
    data,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ['comments', fileId],
    queryFn: async () => {
      if (!fileId) return { comments: [] };
      return apiCall<{ comments: Comment[] }>('GET', `/files/${fileId}/comments`);
    },
    enabled: !!fileId,
  });

  const comments = data?.comments ?? [];

  const addCommentMutation = useMutation({
    mutationFn: async ({
      targetFileId,
      text,
      lineNumber,
      parentId,
    }: {
      targetFileId: string;
      text: string;
      lineNumber?: number;
      parentId?: string;
    }) => {
      return apiCall<{ comment: Comment }>('POST', `/files/${targetFileId}/comments`, {
        text,
        lineNumber,
        parentId,
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['comments', fileId], (old: { comments: Comment[] } | undefined) => ({
        comments: [...(old?.comments || []), data.comment],
      }));
      toast.success('Comment added');
    },
    onError: () => {
      toast.error('Failed to add comment');
    },
  });

  const resolveCommentMutation = useMutation({
    mutationFn: async ({ commentId, resolved }: { commentId: string; resolved: boolean }) => {
      await apiCall(resolved ? 'POST' : 'DELETE', `/comments/${commentId}/resolve`);
      return { commentId, resolved };
    },
    onSuccess: ({ commentId, resolved }) => {
      queryClient.setQueryData(['comments', fileId], (old: { comments: Comment[] } | undefined) => ({
        comments: (old?.comments ?? []).map((c) =>
          c.id === commentId || c.threadId === commentId ? { ...c, isResolved: resolved } : c
        ),
      }));
      toast.success(resolved ? 'Comment resolved' : 'Comment reopened');
    },
    onError: () => {
      toast.error('Failed to update comment');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await apiCall('DELETE', `/comments/${commentId}`);
      return commentId;
    },
    onSuccess: (commentId) => {
      queryClient.setQueryData(['comments', fileId], (old: { comments: Comment[] } | undefined) => ({
        comments: (old?.comments ?? []).filter((c) => c.id !== commentId),
      }));
      toast.success('Comment deleted');
    },
    onError: () => {
      toast.error('Failed to delete comment');
    },
  });

  // Group comments by line number
  const commentsByLine = useMemo(() => {
    return comments.reduce(
      (acc, comment) => {
        const line = comment.lineNumber ?? 0;
        if (!acc[line]) acc[line] = [];
        acc[line].push(comment);
        return acc;
      },
      {} as Record<number, Comment[]>
    );
  }, [comments]);

  const addComment = useCallback(
    async (text: string, lineNumber?: number, parentId?: string) => {
      if (!fileId) {
        toast.error('No file selected');
        return;
      }
      return addCommentMutation.mutateAsync({ targetFileId: fileId, text, lineNumber, parentId });
    },
    [fileId, addCommentMutation]
  );

  const resolveComment = useCallback(
    async (commentId: string, resolved: boolean) => {
      return resolveCommentMutation.mutateAsync({ commentId, resolved });
    },
    [resolveCommentMutation]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      return deleteCommentMutation.mutateAsync(commentId);
    },
    [deleteCommentMutation]
  );

  return {
    comments,
    commentsByLine,
    loading,
    refetch,
    addComment,
    resolveComment,
    deleteComment,
  };
}
