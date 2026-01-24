import React, { useEffect, useRef, useMemo } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-sql';
import { File } from '../../../api/files/files';
import { Comment } from '../../../api/comments/comments';
import { Cursor } from '../../../api/cursors/cursors';
import { CursorOverlay } from './Cursors';

interface CodeViewProps {
  file: File;
  comments: Map<number, Comment[]>;
  cursors: Cursor[];
  onLineClick: (lineNumber: number) => void;
  onCursorMove?: (line: number, column: number) => void;
}

export const CodeView: React.FC<CodeViewProps> = ({
  file,
  comments,
  cursors,
  onLineClick,
  onCursorMove
}) => {
  const codeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => file.content.split('\n'), [file.content]);

  // Map language names to Prism language identifiers
  const prismLanguage = useMemo(() => {
    const map: Record<string, string> = {
      'javascript': 'javascript',
      'typescript': 'typescript',
      'python': 'python',
      'java': 'java',
      'go': 'go',
      'rust': 'rust',
      'bash': 'bash',
      'json': 'json',
      'yaml': 'yaml',
      'markdown': 'markdown',
      'css': 'css',
      'scss': 'scss',
      'sql': 'sql',
      'html': 'markup',
      'xml': 'markup'
    };
    return map[file.language] || 'plaintext';
  }, [file.language]);

  // Highlight code
  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightAllUnder(codeRef.current);
    }
  }, [file.content, prismLanguage]);

  // Track mouse position for cursor updates
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!onCursorMove || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top + containerRef.current.scrollTop;
    const lineHeight = 20; // Approximate line height
    const line = Math.floor(y / lineHeight) + 1;

    // Approximate column based on monospace font
    const x = e.clientX - rect.left - 60; // Account for line numbers
    const charWidth = 8; // Approximate character width
    const column = Math.max(0, Math.floor(x / charWidth));

    onCursorMove(Math.min(line, lines.length), column);
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-auto bg-gray-900 text-gray-100"
      onMouseMove={handleMouseMove}
    >
      {/* Cursor overlay */}
      <CursorOverlay cursors={cursors} lineHeight={20} charWidth={8} />

      <div ref={codeRef} className="font-mono text-[13px] leading-tight">
        {lines.map((line, index) => {
          const lineNumber = index + 1;
          const lineComments = comments.get(lineNumber);
          const hasComments = lineComments && lineComments.length > 0;
          const unresolvedCount = lineComments?.filter(c => !c.isResolved).length || 0;

          return (
            <div
              key={index}
              className="flex group hover:bg-gray-800/50 h-[20px] leading-[20px]"
            >
              {/* Line number */}
              <div
                className="shrink-0 w-14 text-right pr-4 text-gray-500 select-none cursor-pointer hover:text-blue-400 hover:bg-gray-700/50"
                onClick={() => onLineClick(lineNumber)}
              >
                <span className="relative">
                  {lineNumber}

                  {/* Comment indicator */}
                  {hasComments && (
                    <span
                      className={`absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                        unresolvedCount > 0 ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                      title={`${lineComments?.length} comment(s)`}
                    />
                  )}
                </span>
              </div>

              {/* Code line */}
              <code className={`language-${prismLanguage} flex-1 whitespace-pre overflow-x-auto`}>
                {line || ' '}
              </code>

              {/* Add comment button (shown on hover) */}
              <button
                className="shrink-0 w-8 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-blue-400 transition-opacity"
                onClick={() => onLineClick(lineNumber)}
                title="Add comment"
              >
                <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
