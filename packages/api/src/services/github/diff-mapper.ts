/**
 * Diff line position mapper
 * Maps file line numbers to GitHub diff positions for PR review comments
 *
 * GitHub API requires the position in the diff, not the file line number.
 * Position 1 is the first line after the @@ hunk header.
 */

import type { DiffHunk } from '@codesync/shared';

export interface DiffPosition {
  /** Position in the diff (1-based, relative to hunk) */
  position: number;
  /** Which side of the diff: LEFT = old file, RIGHT = new file */
  side: 'LEFT' | 'RIGHT';
}

/**
 * Map a file line number to a diff position for GitHub API
 *
 * @param hunks - The diff hunks from the file
 * @param lineNumber - The line number in the file (1-based)
 * @param side - 'old' for removed lines, 'new' for added/context lines
 * @returns The diff position, or null if line is not in the diff
 */
export function mapLineToDiffPosition(
  hunks: DiffHunk[] | null,
  lineNumber: number,
  side: 'old' | 'new' = 'new'
): DiffPosition | null {
  if (!hunks || hunks.length === 0) {
    return null;
  }

  let position = 0;

  for (const hunk of hunks) {
    // Each hunk starts fresh (GitHub uses per-hunk positioning now)
    // But for createReview, we need the overall position in the diff
    position++; // The @@ hunk header counts as a line

    for (const line of hunk.lines) {
      position++;

      // Match based on which side we're looking for
      if (side === 'new' && line.newLineNumber === lineNumber) {
        // For added or context lines on the new file side
        return {
          position,
          side: line.type === 'remove' ? 'LEFT' : 'RIGHT',
        };
      }

      if (side === 'old' && line.oldLineNumber === lineNumber) {
        // For removed or context lines on the old file side
        return {
          position,
          side: 'LEFT',
        };
      }
    }
  }

  return null; // Line not found in diff
}

/**
 * Find the line number in the new file for a given diff position
 * Inverse of mapLineToDiffPosition
 */
export function mapDiffPositionToLine(
  hunks: DiffHunk[] | null,
  targetPosition: number
): { lineNumber: number; type: 'add' | 'remove' | 'context' } | null {
  if (!hunks || hunks.length === 0) {
    return null;
  }

  let position = 0;

  for (const hunk of hunks) {
    position++; // Hunk header

    for (const line of hunk.lines) {
      position++;

      if (position === targetPosition) {
        const lineNumber = line.type === 'remove' ? line.oldLineNumber : line.newLineNumber;
        if (lineNumber !== undefined) {
          return { lineNumber, type: line.type };
        }
        return null;
      }
    }
  }

  return null;
}

/**
 * Get the commit SHA for a line comment
 * GitHub requires the commit SHA that introduced the line
 */
export function getCommitShaForLine(
  hunks: DiffHunk[] | null,
  lineNumber: number,
  headSha: string,
  _baseSha: string
): string {
  // For simplicity, we always use the head commit SHA
  // This works for most cases since we're commenting on new/modified lines
  // A more sophisticated implementation would track which commit introduced each line

  if (!hunks) return headSha;

  // Find the line in the diff
  for (const hunk of hunks) {
    for (const line of hunk.lines) {
      if (line.newLineNumber === lineNumber) {
        // Context and added lines exist in head commit
        return headSha;
      }
    }
  }

  return headSha;
}
