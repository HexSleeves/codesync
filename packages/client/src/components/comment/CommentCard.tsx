import type { Comment } from '@codesync/shared';
import { Button, Card, CardContent } from '@/components/ui';

interface CommentCardProps {
  comment: Comment;
  onResolve: (id: string, resolved: boolean) => void;
}

export function CommentCard({ comment, onResolve }: CommentCardProps) {
  return (
    <Card className={comment.isResolved ? 'opacity-60' : ''}>
      <CardContent className="p-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{comment.author?.name || 'Unknown'}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => onResolve(comment.id, !comment.isResolved)}
          >
            {comment.isResolved ? 'Unresolve' : 'Resolve'}
          </Button>
        </div>
        <p
          className={`text-sm ${comment.isResolved ? 'text-muted-foreground' : 'text-foreground'}`}
        >
          {comment.text}
        </p>
      </CardContent>
    </Card>
  );
}
