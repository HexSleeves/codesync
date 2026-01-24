import React, { useMemo } from 'react';
import type { File } from '../../../api/files/files';
import type { Comment } from '../../../api/comments/comments';
import { createDiffFromStrings } from '../../utils/diff-parser';
import { UnifiedDiff } from './UnifiedDiff';
import { SplitDiff } from './SplitDiff';

interface DiffViewerProps {
  file: File;
  mode: 'unified' | 'split' | 'inline';
  comments: Map<number, Comment[]>;
  onLineClick: (lineNumber: number, side?: 'old' | 'new') => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ file, mode, comments, onLineClick }) => {
  // Generate hunks if not already present
  const hunks = useMemo(() => {
    if (file.hunks && file.hunks.length > 0) {
      return file.hunks;
    }

    // Generate diff from content
    if (file.originalContent !== undefined) {
      return createDiffFromStrings(file.originalContent, file.content);
    }

    // No diff available - show entire file as added
    if (file.isAdded) {
      const lines = file.content.split('\n');
      return [
        {
          oldStart: 0,
          oldLines: 0,
          newStart: 1,
          newLines: lines.length,
          lines: lines.map((content, index) => ({
            type: 'add' as const,
            content,
            newLineNumber: index + 1,
          })),
        },
      ];
    }

    return [];
  }, [file]);

  if (hunks.length === 0 && !file.isAdded && !file.isDeleted) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No changes to display</p>
        <p className="text-sm mt-2">This file appears unchanged</p>
      </div>
    );
  }

  return mode === 'split' ? (
    <SplitDiff hunks={hunks} comments={comments} onLineClick={onLineClick} />
  ) : (
    <UnifiedDiff hunks={hunks} comments={comments} onLineClick={onLineClick} />
  );
};
