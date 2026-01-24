import { Hunk, DiffLine } from '../../api/files/files';
import * as Diff from 'diff';

export function parsePatch(patch: string): Hunk[] {
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
      } else {
        // Skip diff headers and other non-content lines
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

export function createDiffFromStrings(oldStr: string, newStr: string): Hunk[] {
  const changes = Diff.diffLines(oldStr, newStr);

  const hunks: Hunk[] = [];
  let currentHunk: Hunk | null = null;
  let oldLineNum = 1;
  let newLineNum = 1;
  let contextCount = 0;
  const CONTEXT_LINES = 3;

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    const lines = change.value.split('\n').filter(
      (l, idx, arr) => idx < arr.length - 1 || l !== '' // Filter trailing empty line from split
    );

    if (change.added || change.removed) {
      // Start a new hunk if needed
      if (!currentHunk) {
        currentHunk = {
          oldStart: Math.max(1, oldLineNum - CONTEXT_LINES),
          oldLines: 0,
          newStart: Math.max(1, newLineNum - CONTEXT_LINES),
          newLines: 0,
          lines: [],
        };
      }

      contextCount = 0;

      for (const lineContent of lines) {
        if (change.added) {
          currentHunk.lines.push({
            type: 'add',
            content: lineContent,
            newLineNumber: newLineNum++,
          });
          currentHunk.newLines++;
        } else {
          currentHunk.lines.push({
            type: 'remove',
            content: lineContent,
            oldLineNumber: oldLineNum++,
          });
          currentHunk.oldLines++;
        }
      }
    } else {
      // Context lines
      for (const lineContent of lines) {
        if (currentHunk) {
          if (contextCount < CONTEXT_LINES) {
            currentHunk.lines.push({
              type: 'context',
              content: lineContent,
              oldLineNumber: oldLineNum,
              newLineNumber: newLineNum,
            });
            currentHunk.oldLines++;
            currentHunk.newLines++;
          } else {
            // Close the hunk and start potential new one
            hunks.push(currentHunk);
            currentHunk = null;
          }
          contextCount++;
        }
        oldLineNum++;
        newLineNum++;
      }
    }
  }

  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return hunks;
}

export function getLinePairs(hunk: Hunk): Array<{ old?: DiffLine; new?: DiffLine }> {
  const pairs: Array<{ old?: DiffLine; new?: DiffLine }> = [];
  let i = 0;

  while (i < hunk.lines.length) {
    const line = hunk.lines[i];

    if (line.type === 'context') {
      pairs.push({ old: line, new: line });
      i++;
    } else if (line.type === 'remove') {
      // Look ahead for corresponding add
      const next = hunk.lines[i + 1];
      if (next && next.type === 'add') {
        pairs.push({ old: line, new: next });
        i += 2;
      } else {
        pairs.push({ old: line });
        i++;
      }
    } else if (line.type === 'add') {
      pairs.push({ new: line });
      i++;
    } else {
      i++;
    }
  }

  return pairs;
}
