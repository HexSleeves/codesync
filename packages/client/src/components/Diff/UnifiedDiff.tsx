/**
 * Unified diff view component
 */

import type { Comment, DiffHunk, DiffLine } from '@codesync/shared';

export interface UnifiedDiffProps {
  hunks: DiffHunk[];
  comments: Map<number, Comment[]>;
  onLineClick: (lineNumber: number, side?: 'old' | 'new') => void;
}

export function UnifiedDiff({ hunks, comments, onLineClick }: UnifiedDiffProps) {
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
}: {
  line: DiffLine;
  comments: Map<number, Comment[]>;
  onLineClick: (lineNumber: number, side?: 'old' | 'new') => void;
}) {
  const bgColor =
    line.type === 'add' ? 'bg-green-500/10' : line.type === 'remove' ? 'bg-destructive/10' : '';

  const textColor =
    line.type === 'add'
      ? 'text-green-400'
      : line.type === 'remove'
        ? 'text-destructive'
        : 'text-muted-foreground';

  const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';

  const lineNumber = line.newLineNumber || line.oldLineNumber || 0;
  const lineComments = comments.get(lineNumber);
  const hasComments = lineComments && lineComments.length > 0;

  return (
    <div className={`flex group ${bgColor} hover:bg-accent/50`}>
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
      <span className={`inline-block w-4 ${textColor} select-none`}>{prefix}</span>

      {/* Content */}
      <span className={`flex-1 whitespace-pre ${textColor}`}>{line.content}</span>

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
