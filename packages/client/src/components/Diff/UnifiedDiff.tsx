/**
 * Unified diff view component with syntax highlighting
 */

import type { Comment, CursorMessage, DiffHunk, DiffLine } from '@codesync/shared';
import { useMemo } from 'hono/jsx';
import { highlightLine } from '@/lib/highlight';

export interface UnifiedDiffProps {
  hunks: DiffHunk[];
  comments: Map<number, Comment[]>;
  onLineClick: (lineNumber: number, side?: 'old' | 'new') => void;
  onLineHover?: (lineNumber: number) => void;
  language: string;
  cursors?: CursorMessage[];
}

export function UnifiedDiff({
  hunks,
  comments,
  onLineClick,
  onLineHover,
  language,
  cursors = [],
}: UnifiedDiffProps) {
  // Create a map of line numbers to cursors (memoized)
  const cursorsByLine = useMemo(() => {
    const map = new Map<number, CursorMessage[]>();
    for (const cursor of cursors) {
      const existing = map.get(cursor.line) || [];
      map.set(cursor.line, [...existing, cursor]);
    }
    return map;
  }, [cursors]);
  return (
    <div className="font-mono text-[13px] leading-5 bg-background text-foreground overflow-x-auto">
      {hunks.map((hunk, hunkIndex) => (
        <div key={hunkIndex} className="mb-2">
          {/* Hunk header */}
          <div className="bg-primary/10 px-4 py-1 text-primary text-xs sticky top-0">
            @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
          </div>

          {/* Lines */}
          {hunk.lines.map((line, lineIndex) => (
            <UnifiedDiffLine
              key={lineIndex}
              line={line}
              comments={comments}
              onLineClick={onLineClick}
              onLineHover={onLineHover}
              language={language}
              cursors={cursorsByLine.get(line.newLineNumber || line.oldLineNumber || 0)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function UnifiedDiffLine({
  line,
  comments,
  onLineClick,
  onLineHover,
  language,
  cursors = [],
}: {
  line: DiffLine;
  comments: Map<number, Comment[]>;
  onLineClick: (lineNumber: number, side?: 'old' | 'new') => void;
  onLineHover?: (lineNumber: number) => void;
  language: string;
  cursors?: CursorMessage[];
}) {
  const bgColor =
    line.type === 'add' ? 'bg-green-500/10' : line.type === 'remove' ? 'bg-destructive/10' : '';

  const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';
  const prefixColor =
    line.type === 'add'
      ? 'text-green-400'
      : line.type === 'remove'
        ? 'text-destructive'
        : 'text-muted-foreground';

  const lineNumber = line.newLineNumber || line.oldLineNumber || 0;
  const lineComments = comments.get(lineNumber);
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
            <div key={cursor.userId} className="flex items-center" title={cursor.userName}>
              <div className="w-0.5 h-4 rounded" style={{ backgroundColor: cursor.color }} />
              <span
                className="text-[9px] px-1 rounded text-white ml-0.5"
                style={{ backgroundColor: cursor.color }}
              >
                {cursor.userName}
              </span>
            </div>
          ))}
        </div>
      )}
      {/* Line numbers */}
      <span
        className="inline-block w-12 text-right pr-2 text-muted-foreground select-none cursor-pointer hover:text-primary"
        onClick={() => line.oldLineNumber && onLineClick(line.oldLineNumber, 'old')}
      >
        {line.oldLineNumber || ''}
      </span>
      <span
        className="inline-block w-12 text-right pr-2 text-muted-foreground select-none cursor-pointer hover:text-primary relative"
        onClick={() => line.newLineNumber && onLineClick(line.newLineNumber, 'new')}
      >
        {line.newLineNumber || ''}
        {hasComments && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
        )}
      </span>

      {/* Prefix */}
      <span className={`inline-block w-4 ${prefixColor} select-none`}>{prefix}</span>

      {/* Content with syntax highlighting */}
      <span
        className="flex-1 whitespace-pre"
        dangerouslySetInnerHTML={{ __html: highlightedContent || '&nbsp;' }}
      />

      {/* Add comment button */}
      <button
        className="shrink-0 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"
        onClick={() =>
          lineNumber && onLineClick(lineNumber, line.type === 'remove' ? 'old' : 'new')
        }
        title="Add comment"
      >
        <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
