/**
 * Split (side-by-side) diff view component
 */

import type { Comment, DiffHunk, DiffLine } from '@codesync/shared';
import { useMemo } from 'hono/jsx';

interface DiffLineWithHeader extends DiffLine {
  isHunkHeader?: boolean;
}

export interface SplitDiffProps {
  hunks: DiffHunk[];
  comments: Map<number, Comment[]>;
  onLineClick: (lineNumber: number, side?: 'old' | 'new') => void;
}

export function SplitDiff({ hunks, comments, onLineClick }: SplitDiffProps) {
  // Build paired lines for side-by-side view
  const pairedLines = useMemo(() => {
    const pairs: Array<{ left: DiffLineWithHeader | null; right: DiffLineWithHeader | null }> = [];

    for (const hunk of hunks) {
      // Add hunk header as a special pair
      pairs.push({
        left: {
          type: 'context',
          content: `@@ -${hunk.oldStart},${hunk.oldLines}`,
          isHunkHeader: true,
        },
        right: {
          type: 'context',
          content: `+${hunk.newStart},${hunk.newLines} @@`,
          isHunkHeader: true,
        },
      });

      let i = 0;
      while (i < hunk.lines.length) {
        const line = hunk.lines[i];

        if (line.type === 'context') {
          pairs.push({ left: line, right: line });
          i++;
        } else if (line.type === 'remove') {
          // Check if next line is an add (modification)
          const nextLine = hunk.lines[i + 1];
          if (nextLine?.type === 'add') {
            pairs.push({ left: line, right: nextLine });
            i += 2;
          } else {
            pairs.push({ left: line, right: null });
            i++;
          }
        } else if (line.type === 'add') {
          pairs.push({ left: null, right: line });
          i++;
        } else {
          i++;
        }
      }
    }

    return pairs;
  }, [hunks]);

  return (
    <div className="font-mono text-[13px] leading-5 bg-gray-900 text-gray-100 overflow-x-auto">
      <div className="min-w-max">
        {pairedLines.map((pair, index) => (
          <div key={index} className="flex">
            {/* Left side (old) */}
            <div className="w-1/2 border-r border-gray-700">
              <SplitDiffLine
                line={pair.left}
                side="old"
                comments={comments}
                onLineClick={onLineClick}
              />
            </div>
            {/* Right side (new) */}
            <div className="w-1/2">
              <SplitDiffLine
                line={pair.right}
                side="new"
                comments={comments}
                onLineClick={onLineClick}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SplitDiffLine({
  line,
  side,
  comments,
  onLineClick,
}: {
  line: DiffLineWithHeader | null;
  side: 'old' | 'new';
  comments: Map<number, Comment[]>;
  onLineClick: (lineNumber: number, side?: 'old' | 'new') => void;
}) {
  if (!line) {
    return <div className="flex h-5 bg-gray-800/50" />;
  }

  const isHunkHeader = line.isHunkHeader;
  if (isHunkHeader) {
    return (
      <div className="flex bg-blue-900/50 px-2 py-1 text-blue-300 text-xs">{line.content}</div>
    );
  }

  const bgColor =
    line.type === 'add' ? 'bg-green-900/30' : line.type === 'remove' ? 'bg-red-900/30' : '';

  const textColor =
    line.type === 'add'
      ? 'text-green-300'
      : line.type === 'remove'
        ? 'text-red-300'
        : 'text-gray-300';

  const lineNumber = side === 'old' ? line.oldLineNumber : line.newLineNumber;
  const lineComments = lineNumber ? comments.get(lineNumber) : undefined;
  const hasComments = lineComments && lineComments.length > 0;

  return (
    <div className={`flex group ${bgColor} hover:bg-opacity-70`}>
      {/* Line number */}
      <span
        className="inline-block w-12 text-right pr-2 text-gray-500 select-none cursor-pointer hover:text-blue-400 relative shrink-0"
        onClick={() => lineNumber && onLineClick(lineNumber, side)}
      >
        {lineNumber || ''}
        {hasComments && (
          <span className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500" />
        )}
      </span>

      {/* Content */}
      <span className={`flex-1 whitespace-pre px-2 ${textColor} overflow-hidden`}>
        {line.content}
      </span>

      {/* Add comment button */}
      <button
        className="shrink-0 w-6 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-blue-400 transition-opacity"
        onClick={() => lineNumber && onLineClick(lineNumber, side)}
        title="Add comment"
      >
        <svg className="w-3 h-3 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
