/**
 * DiffViewer component - Main diff display
 * Supports unified and split view modes
 */

import { useMemo } from 'hono/jsx';
import type { File, DiffHunk, DiffLine, Comment } from '@codesync/shared';
import { UnifiedDiff } from './UnifiedDiff';
import { SplitDiff } from './SplitDiff';

interface DiffViewerProps {
  file: File;
  mode: 'unified' | 'split';
  comments: Map<number, Comment[]>;
  onLineClick: (lineNumber: number, side?: 'old' | 'new') => void;
}

export function DiffViewer({ file, mode, comments, onLineClick }: DiffViewerProps) {
  // Generate hunks if not already present
  const hunks = useMemo(() => {
    if (file.hunks && file.hunks.length > 0) {
      return file.hunks;
    }

    // Generate diff from content if we have original
    if (file.originalContent !== null && file.originalContent !== undefined && file.content) {
      return createDiffFromStrings(file.originalContent, file.content);
    }

    // No diff available - show entire file as added
    if (file.isAdded && file.content) {
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

    // Show entire file as removed
    if (file.isDeleted && file.originalContent) {
      const lines = file.originalContent.split('\n');
      return [
        {
          oldStart: 1,
          oldLines: lines.length,
          newStart: 0,
          newLines: 0,
          lines: lines.map((content, index) => ({
            type: 'remove' as const,
            content,
            oldLineNumber: index + 1,
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
}

/**
 * Create diff hunks from two strings
 * Simple line-by-line diff algorithm
 */
function createDiffFromStrings(oldStr: string, newStr: string): DiffHunk[] {
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');

  // Use a simple LCS-based diff
  const diffLines = computeDiff(oldLines, newLines);

  if (diffLines.length === 0) {
    return [];
  }

  // Group into hunks
  const hunks: DiffHunk[] = [];
  let currentHunk: DiffHunk | null = null;
  let oldLine = 1;
  let newLine = 1;
  const contextLines = 3;
  let contextBuffer: DiffLine[] = [];

  for (const line of diffLines) {
    if (line.type === 'context') {
      if (currentHunk) {
        currentHunk.lines.push({
          type: 'context',
          content: line.content,
          oldLineNumber: oldLine,
          newLineNumber: newLine,
        });
      } else {
        contextBuffer.push({
          type: 'context',
          content: line.content,
          oldLineNumber: oldLine,
          newLineNumber: newLine,
        });
        if (contextBuffer.length > contextLines) {
          contextBuffer.shift();
        }
      }
      oldLine++;
      newLine++;
    } else {
      // Start a new hunk if needed
      if (!currentHunk) {
        const startOld = Math.max(1, oldLine - contextBuffer.length);
        const startNew = Math.max(1, newLine - contextBuffer.length);
        currentHunk = {
          oldStart: startOld,
          oldLines: 0,
          newStart: startNew,
          newLines: 0,
          lines: [...contextBuffer],
        };
        contextBuffer = [];
      }

      if (line.type === 'remove') {
        currentHunk.lines.push({
          type: 'remove',
          content: line.content,
          oldLineNumber: oldLine,
        });
        oldLine++;
      } else if (line.type === 'add') {
        currentHunk.lines.push({
          type: 'add',
          content: line.content,
          newLineNumber: newLine,
        });
        newLine++;
      }
    }

    // Close hunk after enough context
    if (currentHunk && contextBuffer.length === 0) {
      const lastNonContext = [...currentHunk.lines].reverse().findIndex(l => l.type !== 'context');
      if (lastNonContext >= contextLines) {
        // Finalize hunk
        const hunkOldEnd = currentHunk.lines.filter(
          l => l.type === 'context' || l.type === 'remove'
        ).length;
        const hunkNewEnd = currentHunk.lines.filter(
          l => l.type === 'context' || l.type === 'add'
        ).length;
        currentHunk.oldLines = hunkOldEnd;
        currentHunk.newLines = hunkNewEnd;
        hunks.push(currentHunk);
        currentHunk = null;
      }
    }
  }

  // Finalize any remaining hunk
  if (currentHunk) {
    currentHunk.oldLines = currentHunk.lines.filter(
      l => l.type === 'context' || l.type === 'remove'
    ).length;
    currentHunk.newLines = currentHunk.lines.filter(
      l => l.type === 'context' || l.type === 'add'
    ).length;
    hunks.push(currentHunk);
  }

  return hunks;
}

/**
 * Simple diff algorithm
 */
function computeDiff(
  oldLines: string[],
  newLines: string[]
): Array<{ type: 'context' | 'add' | 'remove'; content: string }> {
  const result: Array<{ type: 'context' | 'add' | 'remove'; content: string }> = [];

  // Myers diff algorithm simplified
  const n = oldLines.length;
  const m = newLines.length;
  const max = n + m;

  if (max === 0) return result;

  // Build a simple LCS table
  const dp: number[][] = Array(n + 1)
    .fill(null)
    .map(() => Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  const diff: Array<{ type: 'context' | 'add' | 'remove'; content: string }> = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      diff.unshift({ type: 'context', content: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({ type: 'add', content: newLines[j - 1] });
      j--;
    } else {
      diff.unshift({ type: 'remove', content: oldLines[i - 1] });
      i--;
    }
  }

  return diff;
}
