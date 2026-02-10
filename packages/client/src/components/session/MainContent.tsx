/**
 * Main Content Area - File viewer with header and diff/code viewer
 * Handles file display, comments, and cursor tracking
 */

import type { Comment, CursorMessage, File } from '@codesync/shared';
import { useMemo } from 'hono/jsx';
import { InlineCommentPanel } from '@/components/comment';
import { DiffViewer } from '@/components/Diff';
import { CodeViewer } from '@/pages/session/CodeViewer';
import { FileHeader } from './FileHeader';

interface MainContentProps {
  /** Currently selected file */
  file: File | null;
  /** View mode: diff or code */
  viewMode: 'diff' | 'code';
  /** Diff display mode */
  diffMode: 'unified' | 'split';
  /** Callback to change view mode */
  onViewModeChange: (mode: 'diff' | 'code') => void;
  /** Callback to change diff mode */
  onDiffModeChange: (mode: 'unified' | 'split') => void;
  /** Callback to toggle file reviewed status */
  onToggleReviewed: () => void;
  /** Comments grouped by line number */
  commentsByLine: Record<number, Comment[]>;
  /** Currently active comment line (for inline panel) */
  activeCommentLine: number | null;
  /** Set active comment line */
  onLineClick: (line: number) => void;
  /** Close comment panel */
  onCloseCommentPanel: () => void;
  /** Add a comment */
  onAddComment: (text: string, lineNumber?: number) => Promise<unknown>;
  /** Resolve a comment */
  onResolveComment: (commentId: string, resolved: boolean) => Promise<unknown>;
  /** Line hover callback (for cursor tracking) */
  onLineHover?: (lineNumber: number) => void;
  /** Remote user cursors */
  cursors?: Map<string, CursorMessage>;
  /** Current user ID (to filter out own cursor) */
  currentUserId?: string;
  /** Whether the view is read-only */
  readOnly?: boolean;
}

export function MainContent({
  file,
  viewMode,
  diffMode,
  onViewModeChange,
  onDiffModeChange,
  onToggleReviewed,
  commentsByLine,
  activeCommentLine,
  onLineClick,
  onCloseCommentPanel,
  onAddComment,
  onResolveComment,
  onLineHover,
  cursors = new Map(),
  currentUserId,
  readOnly = false,
}: MainContentProps) {
  // Convert commentsByLine to Map for DiffViewer
  const commentsMap = useMemo(() => {
    const map = new Map<number, Comment[]>();
    for (const [line, comms] of Object.entries(commentsByLine)) {
      map.set(parseInt(line, 10), comms);
    }
    return map;
  }, [commentsByLine]);

  if (!file) {
    return <EmptyFileSelection />;
  }

  const handleAddComment = async (text: string) => {
    if (activeCommentLine !== null) {
      await onAddComment(text, activeCommentLine);
      onCloseCommentPanel();
    }
  };

  return (
    <>
      <FileHeader
        file={file}
        viewMode={viewMode}
        diffMode={diffMode}
        onViewModeChange={onViewModeChange}
        onDiffModeChange={onDiffModeChange}
        onToggleReviewed={readOnly ? undefined : onToggleReviewed}
      />

      <div className="flex-1 overflow-auto relative">
        {viewMode === 'diff' ? (
          <div className="flex flex-col h-full">
            <DiffViewer
              file={file}
              mode={diffMode}
              comments={commentsMap}
              onLineClick={readOnly ? () => {} : onLineClick}
              onLineHover={onLineHover || (() => {})}
              cursors={cursors}
              currentUserId={currentUserId}
            />
            {!readOnly && activeCommentLine !== null && (
              <InlineCommentPanel
                lineNumber={activeCommentLine}
                comments={commentsByLine[activeCommentLine] || []}
                onSubmit={handleAddComment}
                onClose={onCloseCommentPanel}
                onResolve={onResolveComment}
              />
            )}
          </div>
        ) : (
          <CodeViewer
            file={file}
            commentsByLine={commentsByLine}
            onAddComment={readOnly ? undefined : onAddComment}
            onResolveComment={readOnly ? undefined : onResolveComment}
            onLineHover={onLineHover}
            cursors={cursors}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </>
  );
}

function EmptyFileSelection() {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <p className="text-lg">Select a file to review</p>
        <p className="text-sm mt-2">Choose a file from the sidebar</p>
      </div>
    </div>
  );
}
