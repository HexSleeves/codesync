/**
 * Comments hook - manages file comments
 */

import type { Comment } from '@codesync/shared';
import { useCallback, useEffect, useState } from 'hono/jsx';
import { apiCall } from '../api/client';
import { toast } from '@/components/ui/sonner';

export function useComments(fileId: string | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!fileId) {
      setComments([]);
      return;
    }

    setLoading(true);
    try {
      const { comments } = await apiCall<{ comments: Comment[] }>(
        'GET',
        `/files/${fileId}/comments`
      );
      setComments(comments);
    } catch (err) {
      console.error('Failed to load comments:', err);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (text: string, lineNumber?: number, parentId?: string) => {
    if (!fileId) return;
    try {
      const { comment } = await apiCall<{ comment: Comment }>('POST', `/files/${fileId}/comments`, {
        text,
        lineNumber,
        parentId,
      });
      setComments((c) => [...c, comment]);
      toast.success('Comment added');
      return comment;
    } catch (err) {
      console.error('Failed to add comment:', err);
      toast.error('Failed to add comment');
    }
  };

  const resolveComment = async (commentId: string, resolved: boolean) => {
    try {
      await apiCall(resolved ? 'POST' : 'DELETE', `/comments/${commentId}/resolve`);
      setComments((c) =>
        c.map((comment) =>
          comment.id === commentId || comment.threadId === commentId
            ? { ...comment, isResolved: resolved }
            : comment
        )
      );
      toast.success(resolved ? 'Comment resolved' : 'Comment reopened');
    } catch (err) {
      console.error('Failed to resolve comment:', err);
      toast.error('Failed to update comment');
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await apiCall('DELETE', `/comments/${commentId}`);
      setComments((c) => c.filter((comment) => comment.id !== commentId));
      toast.success('Comment deleted');
    } catch (err) {
      console.error('Failed to delete comment:', err);
      toast.error('Failed to delete comment');
    }
  };

  // Group comments by line number
  const commentsByLine = comments.reduce(
    (acc, comment) => {
      const line = comment.lineNumber ?? 0;
      if (!acc[line]) acc[line] = [];
      acc[line].push(comment);
      return acc;
    },
    {} as Record<number, Comment[]>
  );

  return {
    comments,
    commentsByLine,
    loading,
    refetch: fetchComments,
    addComment,
    resolveComment,
    deleteComment,
  };
}
