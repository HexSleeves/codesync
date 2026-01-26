/**
 * DiffViewer component - Main diff display
 * Supports unified and split view modes with syntax highlighting
 */

import type { Comment, CursorMessage, DiffHunk, File } from '@codesync/shared';
import { useMemo } from 'hono/jsx';
import { createAddedFileHunks, createDeletedFileHunks, createDiffFromStrings } from '@/lib/diff';
import { getLanguageFromFilename } from '@/lib/highlight';
import { SplitDiff } from './SplitDiff';
import { UnifiedDiff } from './UnifiedDiff';

interface DiffViewerProps {
  file: File;
  mode: 'unified' | 'split';
  comments: Map<number, Comment[]>;
  onLineClick: (lineNumber: number, side?: 'old' | 'new') => void;
  onLineHover?: (lineNumber: number) => void;
  cursors?: Map<string, CursorMessage>;
  currentUserId?: string;
}

export function DiffViewer({
  file,
  mode,
  comments,
  onLineClick,
  onLineHover,
  cursors,
  currentUserId,
}: DiffViewerProps) {
  const hunks = useMemo(() => computeHunks(file), [file]);
  const language = useMemo(
    () => getLanguageFromFilename(file.name || file.path),
    [file.name, file.path]
  );

  // Filter cursors for this file
  const fileCursors = useMemo(() => {
    if (!cursors) return [];
    return Array.from(cursors.values()).filter(
      (c) => c.fileId === file.id && c.userId !== currentUserId
    );
  }, [cursors, file.id, currentUserId]);

  if (hunks.length === 0 && !file.isAdded && !file.isDeleted) {
    return <NoDiffMessage />;
  }

  if (mode === 'split') {
    return (
      <SplitDiff
        hunks={hunks}
        comments={comments}
        onLineClick={onLineClick}
        onLineHover={onLineHover}
        language={language}
        cursors={fileCursors}
      />
    );
  }

  return (
    <UnifiedDiff
      hunks={hunks}
      comments={comments}
      onLineClick={onLineClick}
      onLineHover={onLineHover}
      language={language}
      cursors={fileCursors}
    />
  );
}

function computeHunks(file: File): DiffHunk[] {
  // Use existing hunks if available
  if (file.hunks && file.hunks.length > 0) {
    return file.hunks;
  }

  // Generate diff from content if we have original
  if (file.originalContent !== null && file.originalContent !== undefined && file.content) {
    return createDiffFromStrings(file.originalContent, file.content);
  }

  // Show entire file as added
  if (file.isAdded && file.content) {
    return createAddedFileHunks(file.content);
  }

  // Show entire file as removed
  if (file.isDeleted && file.originalContent) {
    return createDeletedFileHunks(file.originalContent);
  }

  return [];
}

function NoDiffMessage() {
  return (
    <div className="p-8 text-center text-muted-foreground">
      <p>No changes to display</p>
      <p className="text-sm mt-2">This file appears unchanged</p>
    </div>
  );
}
