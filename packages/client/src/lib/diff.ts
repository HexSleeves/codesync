/**
 * Diff algorithm utilities
 * Extracted from DiffViewer component for reusability
 */

import type { DiffHunk, DiffLine } from '@codesync/shared';

/**
 * Create diff hunks from two strings
 * Uses LCS-based diff algorithm
 */
export function createDiffFromStrings(oldStr: string, newStr: string): DiffHunk[] {
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');

  const diffLines = computeDiff(oldLines, newLines);

  if (diffLines.length === 0) {
    return [];
  }

  return groupIntoHunks(diffLines);
}

/**
 * Create hunks for a newly added file
 */
export function createAddedFileHunks(content: string): DiffHunk[] {
  const lines = content.split('\n');
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

/**
 * Create hunks for a deleted file
 */
export function createDeletedFileHunks(content: string): DiffHunk[] {
  const lines = content.split('\n');
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

/**
 * Simple LCS-based diff algorithm
 */
function computeDiff(
  oldLines: string[],
  newLines: string[]
): Array<{ type: 'context' | 'add' | 'remove'; content: string }> {
  const n = oldLines.length;
  const m = newLines.length;

  if (n + m === 0) return [];

  // Build LCS table
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

/**
 * Group diff lines into hunks with context
 */
function groupIntoHunks(
  diffLines: Array<{ type: 'context' | 'add' | 'remove'; content: string }>
): DiffHunk[] {
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
      const lastNonContext = [...currentHunk.lines]
        .reverse()
        .findIndex((l) => l.type !== 'context');
      if (lastNonContext >= contextLines) {
        finalizeHunk(currentHunk);
        hunks.push(currentHunk);
        currentHunk = null;
      }
    }
  }

  // Finalize any remaining hunk
  if (currentHunk) {
    finalizeHunk(currentHunk);
    hunks.push(currentHunk);
  }

  return hunks;
}

function finalizeHunk(hunk: DiffHunk): void {
  hunk.oldLines = hunk.lines.filter((l) => l.type === 'context' || l.type === 'remove').length;
  hunk.newLines = hunk.lines.filter((l) => l.type === 'context' || l.type === 'add').length;
}
