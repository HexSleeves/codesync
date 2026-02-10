/**
 * Code viewer component - displays file content with line numbers, comments, and cursors
 */

import type { Comment, CursorMessage, File } from '@codesync/shared';
import { memo, useMemo, useState } from 'hono/jsx';
import { CommentCard } from '@/components/comment';
import { Button, Textarea } from '@/components/ui';

interface CodeViewerProps {
  file: File;
  commentsByLine: Record<number, Comment[]>;
  /** Optional - if not provided, commenting is disabled (read-only mode) */
  onAddComment?: (text: string, lineNumber?: number) => Promise<any>;
  /** Optional - if not provided, resolving is disabled (read-only mode) */
  onResolveComment?: (id: string, resolved: boolean) => Promise<unknown>;
  /** Line hover callback (for cursor tracking) */
  onLineHover?: (lineNumber: number) => void;
  /** Remote user cursors */
  cursors?: Map<string, CursorMessage>;
  /** Current user ID (to filter out own cursor) */
  currentUserId?: string;
}

export function CodeViewer({
  file,
  commentsByLine,
  onAddComment,
  onResolveComment,
  onLineHover,
  cursors,
  currentUserId,
}: CodeViewerProps) {
  const [activeCommentLine, setActiveCommentLine] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');

  const content = file.content || '';
  const lines = content.split('\n');

  // Filter cursors for this file
  const fileCursors = useMemo(() => {
    if (!cursors) return [];
    return Array.from(cursors.values()).filter(
      (c) => c.fileId === file.id && c.userId !== currentUserId
    );
  }, [cursors, file.id, currentUserId]);

  // Create a map of line numbers to cursors
  const cursorsByLine = useMemo(() => {
    const map = new Map<number, CursorMessage[]>();
    for (const cursor of fileCursors) {
      const existing = map.get(cursor.line) || [];
      map.set(cursor.line, [...existing, cursor]);
    }
    return map;
  }, [fileCursors]);

  const handleAddComment = async (lineNumber: number) => {
    if (!commentText.trim() || !onAddComment) return;
    await onAddComment(commentText, lineNumber);
    setCommentText('');
    setActiveCommentLine(null);
  };

  const readOnly = !onAddComment;

  return (
    <div className="font-mono text-sm">
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((line, index) => {
            const lineNumber = index + 1;
            const lineComments = commentsByLine[lineNumber] || [];
            const hasComments = lineComments.length > 0;
            const isActiveInput = activeCommentLine === lineNumber;
            const lineCursors = cursorsByLine.get(lineNumber) || [];

            return (
              <CodeLine
                key={lineNumber}
                lineNumber={lineNumber}
                content={line}
                comments={lineComments}
                hasComments={hasComments}
                isActiveInput={isActiveInput}
                commentText={commentText}
                readOnly={readOnly}
                cursors={lineCursors}
                onCommentTextChange={setCommentText}
                onOpenCommentInput={() => setActiveCommentLine(lineNumber)}
                onCloseCommentInput={() => setActiveCommentLine(null)}
                onSubmitComment={() => handleAddComment(lineNumber)}
                onResolveComment={onResolveComment}
                onLineHover={onLineHover}
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
  readOnly: boolean;
  cursors: CursorMessage[];
  onCommentTextChange: (text: string) => void;
  onOpenCommentInput: () => void;
  onCloseCommentInput: () => void;
  onSubmitComment: () => void;
  onResolveComment?: (id: string, resolved: boolean) => Promise<unknown>;
  onLineHover?: (lineNumber: number) => void;
}

function CodeLine({
  lineNumber,
  content,
  comments,
  hasComments,
  isActiveInput,
  commentText,
  readOnly,
  cursors,
  onCommentTextChange,
  onOpenCommentInput,
  onCloseCommentInput,
  onSubmitComment,
  onResolveComment,
  onLineHover,
}: CodeLineProps) {
  const hasCursors = cursors.length > 0;

  return (
    <>
      <tr className="hover:bg-accent group relative" onMouseEnter={() => onLineHover?.(lineNumber)}>
        {/* Remote user cursors */}
        {hasCursors && (
          <td className="absolute left-0 top-0 h-full flex items-center pointer-events-none z-10 p-0">
            <div className="flex items-center">
              {cursors.map((cursor) => (
                <div
                  key={cursor.userId}
                  className="flex items-center animate-cursor-fade-in"
                  title={cursor.userName}
                >
                  <div
                    className="w-0.5 h-4 rounded transition-all duration-150"
                    style={{ backgroundColor: cursor.color }}
                  />
                  <span
                    className="text-[9px] px-1 rounded text-white ml-0.5 transition-all duration-150"
                    style={{ backgroundColor: cursor.color }}
                  >
                    {cursor.userName}
                  </span>
                </div>
              ))}
            </div>
          </td>
        )}
        <LineNumber number={lineNumber} />
        {!readOnly && <AddCommentButton onClick={onOpenCommentInput} />}
        <LineContent content={content} />
        <CommentIndicator count={comments.length} hasComments={hasComments} />
      </tr>

      {hasComments && (
        <tr>
          <td colSpan={readOnly ? 3 : 4} className="bg-card border-l-2 border-primary">
            <div className="p-3 space-y-2">
              {comments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} onResolve={onResolveComment} />
              ))}
            </div>
          </td>
        </tr>
      )}

      {!readOnly && isActiveInput && (
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

const LineNumber = memo(function LineNumber({ number }: { number: number }) {
  return (
    <td className="w-12 px-2 py-0 text-right text-muted-foreground select-none border-r border-border sticky left-0 bg-background">
      {number}
    </td>
  );
});

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

const LineContent = memo(function LineContent({ content }: { content: string }) {
  return <td className="px-4 py-0 whitespace-pre">{content || ' '}</td>;
});

function CommentIndicator({ count, hasComments }: { count: number; hasComments: boolean }) {
  if (!hasComments) return <td className="w-8 px-1" />;

  return (
    <td className="w-8 px-1">
      <span className="text-primary">💬 {count}</span>
    </td>
  );
}
