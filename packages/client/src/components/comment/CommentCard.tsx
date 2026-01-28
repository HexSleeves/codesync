import type { Comment } from '@codesync/shared';
import { GitHubIcon } from '@/components/icons';
import { Button, Card, CardContent } from '@/components/ui';

interface CommentCardProps {
  comment: Comment;
  onResolve?: (id: string, resolved: boolean) => void;
}

export function CommentCard({ comment, onResolve }: CommentCardProps) {
  return (
    <Card className={comment.isResolved ? 'opacity-60' : ''}>
      <CardContent className="p-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{comment.author?.name || 'Unknown'}</span>
            {comment.syncedAt && (
              <span
                className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                title={`Synced to GitHub on ${new Date(comment.syncedAt).toLocaleString()}`}
              >
                <GitHubIcon className="size-3" />
              </span>
            )}
          </div>
          {onResolve && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => onResolve(comment.id, !comment.isResolved)}
            >
              {comment.isResolved ? 'Unresolve' : 'Resolve'}
            </Button>
          )}
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
