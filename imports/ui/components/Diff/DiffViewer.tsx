import React, { useMemo } from 'react';
import { File, Hunk, DiffLine } from '../../../api/files/files';
import { Comment } from '../../../api/comments/comments';
import { createDiffFromStrings } from '../../utils/diff-parser';

interface DiffViewerProps {
  file: File;
  mode: 'unified' | 'split' | 'inline'
  comments: Map<number, Comment[]>;
  onLineClick: (lineNumber: number) => void;
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

  return mode === 'unified' ? (
    <UnifiedDiff hunks={hunks} comments={comments} onLineClick={onLineClick} />
  ) : (
    <SplitDiff hunks={hunks} comments={comments} onLineClick={onLineClick} />
  );
};

interface DiffProps {
  hunks: Hunk[];
  comments: Map<number, Comment[]>;
  onLineClick: (lineNumber: number) => void;
}

const UnifiedDiff: React.FC<DiffProps> = ({ hunks, comments, onLineClick }) => {
  return (
    <div className="font-mono text-sm bg-gray-900 text-gray-100 overflow-x-auto">
      {hunks.map((hunk, hunkIndex) => (
        <div key={hunkIndex} className="mb-2">
          {/* Hunk header */}
          <div className="bg-blue-900/50 px-4 py-1 text-blue-300 text-xs">
            @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
          </div>

          {/* Lines */}
          {hunk.lines.map((line, lineIndex) => (
            <DiffLineRow
              key={lineIndex}
              line={line}
              comments={comments}
              onLineClick={onLineClick}
              showBothNumbers
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const SplitDiff: React.FC<DiffProps> = ({ hunks, comments, onLineClick }) => {
  return (
    <div className="font-mono text-sm bg-gray-900 text-gray-100 overflow-x-auto">
      {hunks.map((hunk, hunkIndex) => (
        <div key={hunkIndex} className="mb-2">
          {/* Hunk header */}
          <div className="bg-blue-900/50 px-4 py-1 text-blue-300 text-xs">
            @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
          </div>

          {/* Split view */}
          <div className="grid grid-cols-2">
            {/* Old version (left) */}
            <div className="border-r border-gray-700">
              {hunk.lines.filter(l => l.type !== 'add').map((line, lineIndex) => (
                <DiffLineRow
                  key={`old-${lineIndex}`}
                  line={line}
                  comments={comments}
                  onLineClick={onLineClick}
                  showOldNumber
                />
              ))}
            </div>

            {/* New version (right) */}
            <div>
              {hunk.lines.filter(l => l.type !== 'remove').map((line, lineIndex) => (
                <DiffLineRow
                  key={`new-${lineIndex}`}
                  line={line}
                  comments={comments}
                  onLineClick={onLineClick}
                  showNewNumber
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

interface DiffLineRowProps {
  line: DiffLine;
  comments: Map<number, Comment[]>;
  onLineClick: (lineNumber: number) => void;
  showBothNumbers?: boolean;
  showOldNumber?: boolean;
  showNewNumber?: boolean;
}

const DiffLineRow: React.FC<DiffLineRowProps> = ({
  line,
  comments,
  onLineClick,
  showBothNumbers,
  showOldNumber,
  showNewNumber
}) => {
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
      {showBothNumbers && (
        <>
          <span
            className="inline-block w-12 text-right pr-2 text-gray-500 select-none cursor-pointer hover:text-blue-400"
            onClick={() => line.oldLineNumber && onLineClick(line.oldLineNumber)}
          >
            {line.oldLineNumber || ''}
          </span>
          <span
            className="inline-block w-12 text-right pr-2 text-gray-500 select-none cursor-pointer hover:text-blue-400 relative"
            onClick={() => line.newLineNumber && onLineClick(line.newLineNumber)}
          >
            {line.newLineNumber || ''}
            {hasComments && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500" />
            )}
          </span>
        </>
      )}
      {showOldNumber && (
        <span
          className="inline-block w-12 text-right pr-2 text-gray-500 select-none cursor-pointer hover:text-blue-400"
          onClick={() => line.oldLineNumber && onLineClick(line.oldLineNumber)}
        >
          {line.oldLineNumber || ''}
        </span>
      )}
      {showNewNumber && (
        <span
          className="inline-block w-12 text-right pr-2 text-gray-500 select-none cursor-pointer hover:text-blue-400 relative"
          onClick={() => line.newLineNumber && onLineClick(line.newLineNumber)}
        >
          {line.newLineNumber || ''}
          {hasComments && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500" />
          )}
        </span>
      )}

      {/* Prefix */}
      <span className={`inline-block w-4 ${textColor} select-none`}>{prefix}</span>

      {/* Content */}
      <span className={`flex-1 whitespace-pre ${textColor}`}>{line.content}</span>

      {/* Add comment button */}
      <button
        className="shrink-0 w-8 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-blue-400 transition-opacity"
        onClick={() => lineNumber && onLineClick(lineNumber)}
        title="Add comment"
      >
        <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};
