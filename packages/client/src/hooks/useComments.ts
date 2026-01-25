/**
 * Comments hook - manages file comments
 */

import { useState, useEffect, useCallback } from 'hono/jsx';
import { apiCall } from '../api/client';
import type { Comment } from '@codesync/shared';

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
      const { comment } = await apiCall<{ comment: Comment }>(
        'POST',
        `/files/${fileId}/comments`,
        { text, lineNumber, parentId }
      );
      setComments(c => [...c, comment]);
      return comment;
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const resolveComment = async (commentId: string, resolved: boolean) => {
    try {
      await apiCall(
        resolved ? 'POST' : 'DELETE',
        `/comments/${commentId}/resolve`
      );
      setComments(c =>
        c.map(comment =>
          comment.id === commentId || comment.threadId === commentId
            ? { ...comment, isResolved: resolved }
            : comment
        )
      );
    } catch (err) {
      console.error('Failed to resolve comment:', err);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await apiCall('DELETE', `/comments/${commentId}`);
      setComments(c => c.filter(comment => comment.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  // Group comments by line number
  const commentsByLine = comments.reduce((acc, comment) => {
    const line = comment.lineNumber ?? 0;
    if (!acc[line]) acc[line] = [];
    acc[line].push(comment);
    return acc;
  }, {} as Record<number, Comment[]>);

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
