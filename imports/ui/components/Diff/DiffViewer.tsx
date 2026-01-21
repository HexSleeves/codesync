import React, { useMemo } from 'react';
import { File, Hunk, DiffLine } from '../../../api/files/files';
import { Comment } from '../../../api/comments/comments';
import { createDiffFromStrings } from '../../utils/diff-parser';

interface DiffViewerProps {
  file: File;
  mode: 'unified' | 'split' | 'inline'
  comments: Map<number, Comment[]>;
  onLineClick: (lineNumber: number, side?: 'old' | 'new') => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  file,
  mode,
  comments,
  onLineClick
}) => {
  // Generate hunks if not already present
  const hunks = useMemo(() => {
    if (file.hunks && file.hunks.length > 0) {
      return file.hunks;
    }

    // Generate diff from content
    if (file.originalContent !== undefined) {
      return createDiffFromStrings(file.originalContent, file.content);
    }

    // No diff available - show entire file as added
    if (file.isAdded) {
      const lines = file.content.split('\n');
      return [{
        oldStart: 0,
        oldLines: 0,
        newStart: 1,
        newLines: lines.length,
        lines: lines.map((content, index) => ({
          type: 'add' as const,
          content,
          newLineNumber: index + 1
        }))
      }];
    }

    return [];
  }, [file]);

  if (hunks.length === 0 && !file.isAdded && !file.isDeleted) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No changes to display</p>
        <p className="text-sm mt-2">This file appears unchanged</p>
      </div>
    );
  }

  return mode === 'split' ? (
    <SplitDiff hunks={hunks} comments={comments} onLineClick={onLineClick} />
  ) : (
    <UnifiedDiff hunks={hunks} comments={comments} onLineClick={onLineClick} />
  );
};

interface DiffProps {
  hunks: Hunk[];
  comments: Map<number, Comment[]>;
  onLineClick: (lineNumber: number, side?: 'old' | 'new') => void;
}

const UnifiedDiff: React.FC<DiffProps> = ({ hunks, comments, onLineClick }) => {
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
    line.type === 'add' ? 'bg-green-900/30' :
    line.type === 'remove' ? 'bg-red-900/30' :
    '';

  const textColor =
    line.type === 'add' ? 'text-green-300' :
    line.type === 'remove' ? 'text-red-300' :
    'text-gray-300';

  const prefix =
    line.type === 'add' ? '+' :
    line.type === 'remove' ? '-' :
    ' ';

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
        onClick={() => lineNumber && onLineClick(lineNumber, line.type === 'remove' ? 'old' : 'new')}
        title="Add comment"
      >
        <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

const SplitDiff: React.FC<DiffProps> = ({ hunks, comments, onLineClick }) => {
  // Build paired lines for side-by-side view
  const pairedLines = useMemo(() => {
    const pairs: Array<{ left: DiffLine | null; right: DiffLine | null }> = [];

    for (const hunk of hunks) {
      // Add hunk header as a special pair
      pairs.push({
        left: { type: 'context', content: `@@ -${hunk.oldStart},${hunk.oldLines}`, isHunkHeader: true } as any,
        right: { type: 'context', content: `+${hunk.newStart},${hunk.newLines} @@`, isHunkHeader: true } as any
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
};

interface SplitDiffLineProps {
  line: DiffLine | null;
  side: 'old' | 'new';
  comments: Map<number, Comment[]>;
  onLineClick: (lineNumber: number, side?: 'old' | 'new') => void;
}

const SplitDiffLine: React.FC<SplitDiffLineProps> = ({ line, side, comments, onLineClick }) => {
  if (!line) {
    return <div className="flex h-5 bg-gray-800/50" />;
  }

  const isHunkHeader = (line as any).isHunkHeader;
  if (isHunkHeader) {
    return (
      <div className="flex bg-blue-900/50 px-2 py-1 text-blue-300 text-xs">
        {line.content}
      </div>
    );
  }

  const bgColor =
    line.type === 'add' ? 'bg-green-900/30' :
    line.type === 'remove' ? 'bg-red-900/30' :
    '';

  const textColor =
    line.type === 'add' ? 'text-green-300' :
    line.type === 'remove' ? 'text-red-300' :
    'text-gray-300';

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
      <span className={`flex-1 whitespace-pre px-2 ${textColor} overflow-hidden`}>{line.content}</span>

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
};
