/**
 * Code viewer component - displays file content with line numbers and comments
 */

import type { Comment, File } from '@codesync/shared';
import { useState } from 'hono/jsx';
import { Button, Textarea } from '@/components/ui';
import { CommentCard } from '@/components/comment';

interface CodeViewerProps {
  file: File;
  commentsByLine: Record<number, Comment[]>;
  onAddComment: (text: string, lineNumber?: number) => Promise<any>;
  onResolveComment: (id: string, resolved: boolean) => Promise<void>;
}

export function CodeViewer({
  file,
  commentsByLine,
  onAddComment,
  onResolveComment,
}: CodeViewerProps) {
  const [activeCommentLine, setActiveCommentLine] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');

  const content = file.content || '';
  const lines = content.split('\n');

  const handleAddComment = async (lineNumber: number) => {
    if (!commentText.trim()) return;
    await onAddComment(commentText, lineNumber);
    setCommentText('');
    setActiveCommentLine(null);
  };

  return (
    <div className="font-mono text-sm">
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((line, index) => {
            const lineNumber = index + 1;
            const lineComments = commentsByLine[lineNumber] || [];
            const hasComments = lineComments.length > 0;
            const isActiveInput = activeCommentLine === lineNumber;

            return (
              <CodeLine
                key={lineNumber}
                lineNumber={lineNumber}
                content={line}
                comments={lineComments}
                hasComments={hasComments}
                isActiveInput={isActiveInput}
                commentText={commentText}
                onCommentTextChange={setCommentText}
                onOpenCommentInput={() => setActiveCommentLine(lineNumber)}
                onCloseCommentInput={() => setActiveCommentLine(null)}
                onSubmitComment={() => handleAddComment(lineNumber)}
                onResolveComment={onResolveComment}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface CodeLineProps {
  lineNumber: number;
  content: string;
  comments: Comment[];
  hasComments: boolean;
  isActiveInput: boolean;
  commentText: string;
  onCommentTextChange: (text: string) => void;
  onOpenCommentInput: () => void;
  onCloseCommentInput: () => void;
  onSubmitComment: () => void;
  onResolveComment: (id: string, resolved: boolean) => Promise<void>;
}

function CodeLine({
  lineNumber,
  content,
  comments,
  hasComments,
  isActiveInput,
  commentText,
  onCommentTextChange,
  onOpenCommentInput,
  onCloseCommentInput,
  onSubmitComment,
  onResolveComment,
}: CodeLineProps) {
  return (
    <>
      <tr className="hover:bg-accent group">
        <LineNumber number={lineNumber} />
        <AddCommentButton onClick={onOpenCommentInput} />
        <LineContent content={content} />
        <CommentIndicator count={comments.length} hasComments={hasComments} />
      </tr>

      {hasComments && (
        <tr>
          <td colSpan={4} className="bg-card border-l-2 border-primary">
            <div className="p-3 space-y-2">
              {comments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} onResolve={onResolveComment} />
              ))}
            </div>
          </td>
        </tr>
      )}

      {isActiveInput && (
        <tr>
          <td colSpan={4} className="bg-card border-l-2 border-green-500">
            <div className="p-3">
              <Textarea
                value={commentText}
                onInput={(e) => onCommentTextChange((e.target as HTMLTextAreaElement).value)}
                placeholder="Add a comment..."
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={onCloseCommentInput}>
                  Cancel
                </Button>
                <Button size="sm" onClick={onSubmitComment} disabled={!commentText.trim()}>
                  Add Comment
                </Button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function LineNumber({ number }: { number: number }) {
  return (
    <td className="w-12 px-2 py-0 text-right text-muted-foreground select-none border-r border-border sticky left-0 bg-background">
      {number}
    </td>
  );
}

function AddCommentButton({ onClick }: { onClick: () => void }) {
  return (
    <td className="w-8 px-1 py-0 text-center">
      <button
        onClick={onClick}
        className="opacity-0 group-hover:opacity-100 text-primary hover:text-primary/80"
      >
        +
      </button>
    </td>
  );
}

function LineContent({ content }: { content: string }) {
  return <td className="px-4 py-0 whitespace-pre">{content || ' '}</td>;
}

function CommentIndicator({ count, hasComments }: { count: number; hasComments: boolean }) {
  if (!hasComments) return <td className="w-8 px-1" />;

  return (
    <td className="w-8 px-1">
      <span className="text-primary">💬 {count}</span>
    </td>
  );
}
