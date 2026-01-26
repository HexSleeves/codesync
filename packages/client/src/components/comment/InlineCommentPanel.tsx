import type { Comment } from '@codesync/shared';
import { Button } from '@/components/ui';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';

interface InlineCommentPanelProps {
  lineNumber: number;
  comments: Comment[];
  onSubmit: (text: string) => Promise<void>;
  onClose: () => void;
  onResolve: (id: string, resolved: boolean) => undefined | Promise<any>;
}

export function InlineCommentPanel({
  lineNumber,
  comments,
  onSubmit,
  onClose,
  onResolve,
}: InlineCommentPanelProps) {
  return (
    <div className="fixed bottom-0 left-64 right-0 bg-card border-t border-border shadow-lg p-4 z-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Comment on line {lineNumber}</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕ Close
          </Button>
        </div>

        {comments.length > 0 && (
          <div className="mb-3">
            <CommentList comments={comments} onResolve={onResolve} />
          </div>
        )}

        <CommentForm onSubmit={onSubmit} variant="inline" />
      </div>
    </div>
  );
}
