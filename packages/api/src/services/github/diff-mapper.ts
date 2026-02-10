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
    // GitHub position starts at the first diff line after the hunk header.
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
