import { Hunk, DiffLine } from '../files/files';
import { GitHubPRInfo } from './types';

/**
 * Parse a GitHub PR URL to extract owner, repo, and PR number
 */
export function parseGitHubPRUrl(url: string): GitHubPRInfo | null {
  // Support formats:
  // https://github.com/owner/repo/pull/123
  // github.com/owner/repo/pull/123
  // owner/repo#123
  // owner/repo/pull/123

  const fullUrlMatch = url.match(/(?:https?:\/\/)?github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i);
  if (fullUrlMatch) {
    return {
      owner: fullUrlMatch[1],
      repo: fullUrlMatch[2],
      prNumber: parseInt(fullUrlMatch[3], 10),
    };
  }

  // Short format: owner/repo#123
  const shortMatch = url.match(/^([^/]+)\/([^#]+)#(\d+)$/);
  if (shortMatch) {
    return {
      owner: shortMatch[1],
      repo: shortMatch[2],
      prNumber: parseInt(shortMatch[3], 10),
    };
  }

  // Path format: owner/repo/pull/123
  const pathMatch = url.match(/^([^/]+)\/([^/]+)\/pull\/(\d+)$/);
  if (pathMatch) {
    return {
      owner: pathMatch[1],
      repo: pathMatch[2],
      prNumber: parseInt(pathMatch[3], 10),
    };
  }

  return null;
}

/**
 * Parse a GitHub patch into hunks
 */
export function parsePatch(patch: string | undefined): Hunk[] {
  if (!patch) return [];

  const hunks: Hunk[] = [];
  const lines = patch.split('\n');

  let currentHunk: Hunk | null = null;
  let oldLineNum = 0;
  let newLineNum = 0;

  for (const line of lines) {
    // Hunk header: @@ -old_start,old_lines +new_start,new_lines @@
    const hunkMatch = line.match(/^@@ -(\d+),?(\d+)? \+(\d+),?(\d+)? @@/);

    if (hunkMatch) {
      if (currentHunk) {
        hunks.push(currentHunk);
      }

      const oldStart = parseInt(hunkMatch[1], 10);
      const oldLines = parseInt(hunkMatch[2] || '1', 10);
      const newStart = parseInt(hunkMatch[3], 10);
      const newLines = parseInt(hunkMatch[4] || '1', 10);

      currentHunk = {
        oldStart,
        oldLines,
        newStart,
        newLines,
        lines: [],
      };

      oldLineNum = oldStart;
      newLineNum = newStart;
    } else if (currentHunk) {
      let type: DiffLine['type'] = 'context';
      let content = line;
      let oldLn: number | undefined;
      let newLn: number | undefined;

      if (line.startsWith('+')) {
        type = 'add';
        content = line.substring(1);
        newLn = newLineNum++;
      } else if (line.startsWith('-')) {
        type = 'remove';
        content = line.substring(1);
        oldLn = oldLineNum++;
      } else if (line.startsWith(' ') || line === '') {
        type = 'context';
        content = line.startsWith(' ') ? line.substring(1) : line;
        oldLn = oldLineNum++;
        newLn = newLineNum++;
      } else if (line.startsWith('\\')) {
        // "\ No newline at end of file" marker - skip
        continue;
      } else {
        // Skip other lines (shouldn't happen in patches)
        continue;
      }

      currentHunk.lines.push({
        type,
        content,
        oldLineNumber: oldLn,
        newLineNumber: newLn,
      });
    }
  }

  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return hunks;
}
