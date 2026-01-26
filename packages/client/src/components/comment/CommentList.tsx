import type { Comment } from '@codesync/shared';
import { CommentCard } from './CommentCard';

interface CommentListProps {
  comments: Comment[];
  onResolve: (id: string, resolved: boolean) => void;
}

export function CommentList({ comments, onResolve }: CommentListProps) {
  if (comments.length === 0) return null;

  return (
    <div className="space-y-2">
      {comments.map((comment) => (
        <CommentCard key={comment.id} comment={comment} onResolve={onResolve} />
      ))}
    </div>
  );
}
