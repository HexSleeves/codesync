import React from 'react';
import type { Hunk, DiffLine } from '../../../api/files/files';
import type { Comment } from '../../../api/comments/comments';

export interface UnifiedDiffProps {
  hunks: Hunk[];
  comments: Map<number, Comment[]>;
  onLineClick: (lineNumber: number, side?: 'old' | 'new') => void;
}

export const UnifiedDiff: React.FC<UnifiedDiffProps> = ({ hunks, comments, onLineClick }) => {
  return (
    <div className="font-mono text-[13px] leading-5 bg-gray-900 text-gray-100 overflow-x-auto">
      {hunks.map((hunk, hunkIndex) => (
        <div key={hunkIndex} className="mb-2">
          {/* Hunk header */}
          <div className="bg-blue-900/50 px-4 py-1 text-blue-300 text-xs">
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
};

interface UnifiedDiffLineProps {
  line: DiffLine;
  comments: Map<number, Comment[]>;
  onLineClick: (lineNumber: number, side?: 'old' | 'new') => void;
}

const UnifiedDiffLine: React.FC<UnifiedDiffLineProps> = ({ line, comments, onLineClick }) => {
  const bgColor =
    line.type === 'add' ? 'bg-green-900/30' : line.type === 'remove' ? 'bg-red-900/30' : '';

  const textColor =
    line.type === 'add'
      ? 'text-green-300'
      : line.type === 'remove'
        ? 'text-red-300'
        : 'text-gray-300';

  const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';

  const lineNumber = line.newLineNumber || line.oldLineNumber || 0;
  const lineComments = comments.get(lineNumber);
  const hasComments = lineComments && lineComments.length > 0;

  return (
    <div className={`flex group ${bgColor} hover:bg-opacity-70`}>
      {/* Line numbers */}
      <span
        className="inline-block w-12 text-right pr-2 text-gray-500 select-none cursor-pointer hover:text-blue-400"
        onClick={() => line.oldLineNumber && onLineClick(line.oldLineNumber, 'old')}
      >
        {line.oldLineNumber || ''}
      </span>
      <span
        className="inline-block w-12 text-right pr-2 text-gray-500 select-none cursor-pointer hover:text-blue-400 relative"
        onClick={() => line.newLineNumber && onLineClick(line.newLineNumber, 'new')}
      >
        {line.newLineNumber || ''}
        {hasComments && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500" />
        )}
      </span>

      {/* Prefix */}
      <span className={`inline-block w-4 ${textColor} select-none`}>{prefix}</span>

      {/* Content */}
      <span className={`flex-1 whitespace-pre ${textColor}`}>{line.content}</span>

      {/* Add comment button */}
      <button
        className="shrink-0 w-8 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-blue-400 transition-opacity"
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
};
