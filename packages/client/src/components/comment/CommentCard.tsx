import type { Comment } from '@codesync/shared';
import { GitHubIcon } from '@/components/icons';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface CommentCardProps {
  comment: Comment;
  onResolve?: (id: string, resolved: boolean) => void;
}

export function CommentCard({ comment, onResolve }: CommentCardProps) {
  return (
    <div className={cn(
      'rounded-lg border border-border/30 p-3 transition-all',
      comment.isResolved ? 'opacity-50' : 'bg-card/30'
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground/80">
            {comment.author?.name || 'Unknown'}
          </span>
          {comment.syncedAt && (
            <span
              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60"
              title={`Synced to GitHub on ${new Date(comment.syncedAt).toLocaleString()}`}
            >
              <GitHubIcon className="size-3" />
              synced
            </span>
          )}
        </div>
        {onResolve && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
            onClick={() => onResolve(comment.id, !comment.isResolved)}
          >
            {comment.isResolved ? 'Reopen' : 'Resolve'}
          </Button>
        )}
      </div>
      <p className={cn(
        'text-sm leading-relaxed',
        comment.isResolved ? 'text-muted-foreground line-through' : 'text-foreground/90'
      )}>
        {comment.text}
      </p>
    </div>
  );
}
