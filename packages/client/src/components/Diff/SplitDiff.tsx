/**
 * Split (side-by-side) diff view component with syntax highlighting
 */

import type { Comment, CursorMessage, DiffHunk, DiffLine } from '@codesync/shared';
import { useMemo } from 'hono/jsx';
import { highlightLine } from '@/lib/highlight';

interface DiffLineWithHeader extends DiffLine {
  isHunkHeader?: boolean;
}

export interface SplitDiffProps {
  hunks: DiffHunk[];
  comments: Map<number, Comment[]>;
  onLineClick: (lineNumber: number, side?: 'old' | 'new') => void;
  onLineHover?: (lineNumber: number) => void;
  language: string;
  cursors?: CursorMessage[];
}

export function SplitDiff({
  hunks,
  comments,
  onLineClick,
  onLineHover,
  language,
  cursors = [],
}: SplitDiffProps) {
  // Create a map of line numbers to cursors
  const cursorsByLine = useMemo(() => {
    const map = new Map<number, CursorMessage[]>();
    for (const cursor of cursors) {
      const existing = map.get(cursor.line) || [];
      map.set(cursor.line, [...existing, cursor]);
    }
    return map;
  }, [cursors]);
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
    <div className="font-mono text-[13px] leading-5 bg-background text-foreground overflow-x-auto">
      <div className="min-w-max">
        {pairedLines.map((pair, index) => (
          <div key={index} className="flex">
            {/* Left side (old) */}
            <div className="w-1/2 border-r border-border">
              <SplitDiffLine
                line={pair.left}
                side="old"
                comments={comments}
                onLineClick={onLineClick}
                onLineHover={onLineHover}
                language={language}
                cursors={
                  pair.left?.oldLineNumber ? cursorsByLine.get(pair.left.oldLineNumber) : undefined
                }
              />
            </div>
            {/* Right side (new) */}
            <div className="w-1/2">
              <SplitDiffLine
                line={pair.right}
                side="new"
                comments={comments}
                onLineClick={onLineClick}
                onLineHover={onLineHover}
                language={language}
                cursors={
                  pair.right?.newLineNumber
                    ? cursorsByLine.get(pair.right.newLineNumber)
                    : undefined
                }
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
  onLineHover,
  language,
  cursors = [],
}: {
  line: DiffLineWithHeader | null;
  side: 'old' | 'new';
  comments: Map<number, Comment[]>;
  onLineClick: (lineNumber: number, side?: 'old' | 'new') => void;
  onLineHover?: (lineNumber: number) => void;
  language: string;
  cursors?: CursorMessage[];
}) {
  if (!line) {
    return <div className="flex h-5 bg-muted/50" />;
  }

  const isHunkHeader = line.isHunkHeader;
  if (isHunkHeader) {
    return <div className="flex bg-primary/10 px-2 py-1 text-primary text-xs">{line.content}</div>;
  }

  const bgColor =
    line.type === 'add' ? 'bg-green-500/10' : line.type === 'remove' ? 'bg-destructive/10' : '';

  const lineNumber = side === 'old' ? line.oldLineNumber : line.newLineNumber;
  const lineComments = lineNumber ? comments.get(lineNumber) : undefined;
  const hasComments = lineComments && lineComments.length > 0;

  // Apply syntax highlighting
  const highlightedContent = highlightLine(line.content, language);

  const hasCursors = cursors.length > 0;

  return (
    <div
      className={`flex group ${bgColor} hover:bg-accent/50 relative`}
      onMouseEnter={() => lineNumber && onLineHover?.(lineNumber)}
    >
      {/* Remote user cursors */}
      {hasCursors && (
        <div className="absolute left-0 top-0 h-full flex items-center pointer-events-none z-10">
          {cursors.map((cursor) => (
            <div
              key={cursor.userId}
              className="flex items-center animate-cursor-fade-in"
              title={cursor.userName}
            >
              <div
                className="w-0.5 h-4 rounded transition-all duration-150"
                style={{ backgroundColor: cursor.color }}
              />
              <span
                className="text-[9px] px-1 rounded text-white ml-0.5 transition-all duration-150"
                style={{ backgroundColor: cursor.color }}
              >
                {cursor.userName}
              </span>
            </div>
          ))}
        </div>
      )}
      {/* Line number */}
      <span
        className="inline-block w-12 text-right pr-2 text-muted-foreground select-none cursor-pointer hover:text-primary relative shrink-0"
        onClick={() => lineNumber && onLineClick(lineNumber, side)}
      >
        {lineNumber || ''}
        {hasComments && (
          <span className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
        )}
      </span>

      {/* Content with syntax highlighting */}
      <span
        className="flex-1 whitespace-pre px-2 overflow-hidden"
        dangerouslySetInnerHTML={{ __html: highlightedContent || '&nbsp;' }}
      />

      {/* Add comment button */}
      <button
        className="shrink-0 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"
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
