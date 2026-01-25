/**
 * Session page - the main code review interface
 */

import { useState, useEffect, useMemo } from 'hono/jsx';
import { navigate, Link } from '../router';
import { useAuth } from '../hooks/useAuth';
import { useSession } from '../hooks/useSession';
import { useComments } from '../hooks/useComments';
import { DiffViewer } from '../components/Diff';
import type { File, Comment } from '@codesync/shared';

interface SessionPageProps {
  sessionId: string;
}

export function SessionPage({ sessionId }: SessionPageProps) {
  const { user } = useAuth();
  const { session, files, loading, error, markFileReviewed } = useSession(sessionId);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'code' | 'diff'>('diff');
  const [diffMode, setDiffMode] = useState<'unified' | 'split'>('unified');
  const [activeCommentLine, setActiveCommentLine] = useState<number | null>(null);

  const selectedFile = files.find((f) => f.id === selectedFileId) || null;
  const { comments, commentsByLine, addComment, resolveComment } = useComments(selectedFileId);

  // Convert commentsByLine to Map for DiffViewer
  const commentsMap = useMemo(() => {
    const map = new Map<number, Comment[]>();
    for (const [line, comms] of Object.entries(commentsByLine)) {
      map.set(parseInt(line, 10), comms as Comment[]);
    }
    return map;
  }, [commentsByLine]);

  // Select first file by default
  useEffect(() => {
    if (files.length > 0 && !selectedFileId) {
      setSelectedFileId(files[0].id);
    }
  }, [files, selectedFileId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Session Not Found</h1>
          <p className="text-gray-400 mb-6">{error || "This session doesn't exist."}</p>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white">
            ←
          </Link>
          <h1 className="text-lg font-semibold text-white">{session.title}</h1>
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded ${
              session.status === 'approved'
                ? 'bg-green-600'
                : session.status === 'in_review'
                ? 'bg-yellow-600'
                : 'bg-gray-600'
            } text-white`}
          >
            {session.status.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{user?.email}</span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File tree sidebar */}
        <aside className="w-64 border-r border-gray-700 bg-gray-800 overflow-y-auto shrink-0">
          <div className="p-3 border-b border-gray-700">
            <h2 className="text-sm font-medium text-gray-400">Files ({files.length})</h2>
          </div>
          <div className="py-2">
            {files.map((file) => (
              <FileTreeItem
                key={file.id}
                file={file}
                isSelected={file.id === selectedFileId}
                onClick={() => setSelectedFileId(file.id)}
              />
            ))}
          </div>
        </aside>

        {/* Code view */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selectedFile ? (
            <>
              {/* File header */}
              <div className="border-b border-gray-700 bg-gray-800 px-4 py-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-gray-300">
                    {selectedFile.path}
                  </span>
                  {selectedFile.isReviewed && (
                    <span className="px-2 py-0.5 bg-green-900/50 text-green-400 rounded text-xs">
                      ✓ Reviewed
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => markFileReviewed(selectedFile.id, !selectedFile.isReviewed)}
                    className={`px-3 py-1 text-sm rounded ${
                      selectedFile.isReviewed
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-green-600 text-white'
                    }`}
                  >
                    {selectedFile.isReviewed ? 'Unmark Reviewed' : 'Mark Reviewed'}
                  </button>
                  <select
                    value={viewMode}
                    onChange={(e) => setViewMode((e.target as HTMLSelectElement).value as 'code' | 'diff')}
                    className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                  >
                    <option value="diff">Diff View</option>
                    <option value="code">Code View</option>
                  </select>
                  {viewMode === 'diff' && (
                    <select
                      value={diffMode}
                      onChange={(e) => setDiffMode((e.target as HTMLSelectElement).value as 'unified' | 'split')}
                      className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                    >
                      <option value="unified">Unified</option>
                      <option value="split">Split</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Code content */}
              <div className="flex-1 overflow-auto">
                {viewMode === 'diff' ? (
                  <div className="flex flex-col h-full">
                    <DiffViewer
                      file={selectedFile}
                      mode={diffMode}
                      comments={commentsMap}
                      onLineClick={(lineNumber, side) => {
                        setActiveCommentLine(lineNumber);
                      }}
                    />
                    {/* Inline comment form */}
                    {activeCommentLine !== null && (
                      <InlineCommentForm
                        lineNumber={activeCommentLine}
                        onSubmit={async (text) => {
                          await addComment(text, activeCommentLine);
                          setActiveCommentLine(null);
                        }}
                        onCancel={() => setActiveCommentLine(null)}
                        existingComments={(commentsByLine[activeCommentLine] || []) as Comment[]}
                        onResolveComment={resolveComment}
                      />
                    )}
                  </div>
                ) : (
                  <CodeViewer
                    file={selectedFile}
                    viewMode={viewMode}
                    commentsByLine={commentsByLine}
                    onAddComment={addComment}
                    onResolveComment={resolveComment}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg">Select a file to review</p>
                <p className="text-sm mt-2">Choose a file from the sidebar</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function FileTreeItem({
  file,
  isSelected,
  onClick,
}: {
  file: File;
  isSelected: boolean;
  onClick: () => void;
}) {
  const getStatusIcon = () => {
    if (file.isAdded) return <span className="text-green-400">A</span>;
    if (file.isDeleted) return <span className="text-red-400">D</span>;
    if (file.isModified) return <span className="text-yellow-400">M</span>;
    return null;
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-gray-700 ${
        isSelected ? 'bg-gray-700 text-white' : 'text-gray-300'
      }`}
    >
      <span className="text-xs font-mono w-4">{getStatusIcon()}</span>
      <span className="truncate text-sm">{file.name}</span>
      {file.isReviewed && (
        <span className="ml-auto text-green-400 text-xs">✓</span>
      )}
    </button>
  );
}

function CodeViewer({
  file,
  viewMode,
  commentsByLine,
  onAddComment,
  onResolveComment,
}: {
  file: File;
  viewMode: 'code' | 'diff';
  commentsByLine: Record<number, any[]>;
  onAddComment: (text: string, lineNumber?: number) => Promise<any>;
  onResolveComment: (id: string, resolved: boolean) => Promise<void>;
}) {
  const [activeCommentLine, setActiveCommentLine] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');

  const content = viewMode === 'diff' && file.originalContent
    ? file.content || ''
    : file.content || '';

  const lines = content.split('\n');

  const handleAddComment = async (lineNumber: number) => {
    if (!commentText.trim()) return;
    await onAddComment(commentText, lineNumber);
    setCommentText('');
    setActiveCommentLine(null);
  };

  return (
    <div className="font-mono text-sm">
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((line, index) => {
            const lineNumber = index + 1;
            const lineComments = commentsByLine[lineNumber] || [];
            const hasComments = lineComments.length > 0;

            return (
              <>
                <tr
                  key={`line-${lineNumber}`}
                  className="hover:bg-gray-800 group"
                >
                  <td className="w-12 px-2 py-0 text-right text-gray-500 select-none border-r border-gray-700 sticky left-0 bg-gray-900">
                    {lineNumber}
                  </td>
                  <td className="w-8 px-1 py-0 text-center">
                    <button
                      onClick={() => setActiveCommentLine(lineNumber)}
                      className="opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-300"
                    >
                      +
                    </button>
                  </td>
                  <td className="px-4 py-0 whitespace-pre">
                    {line || ' '}
                  </td>
                  <td className="w-8 px-1">
                    {hasComments && (
                      <span className="text-blue-400">💬 {lineComments.length}</span>
                    )}
                  </td>
                </tr>

                {/* Comments for this line */}
                {hasComments && (
                  <tr key={`comments-${lineNumber}`}>
                    <td colSpan={4} className="bg-gray-800 border-l-2 border-blue-500">
                      <div className="p-3">
                        {lineComments.map((comment: any) => (
                          <div
                            key={comment.id}
                            className={`mb-2 p-2 rounded ${
                              comment.isResolved ? 'bg-gray-700/50' : 'bg-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-400">
                                {comment.author?.name || 'Unknown'}
                              </span>
                              <button
                                onClick={() => onResolveComment(comment.id, !comment.isResolved)}
                                className="text-xs text-blue-400 hover:text-blue-300"
                              >
                                {comment.isResolved ? 'Unresolve' : 'Resolve'}
                              </button>
                            </div>
                            <p className={comment.isResolved ? 'text-gray-500' : 'text-gray-200'}>
                              {comment.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}

                {/* Comment input for this line */}
                {activeCommentLine === lineNumber && (
                  <tr key={`input-${lineNumber}`}>
                    <td colSpan={4} className="bg-gray-800 border-l-2 border-green-500">
                      <div className="p-3">
                        <textarea
                          value={commentText}
                          onInput={(e) => setCommentText((e.target as HTMLTextAreaElement).value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm resize-none"
                          placeholder="Add a comment..."
                          rows={3}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => setActiveCommentLine(null)}
                            className="px-3 py-1 text-sm text-gray-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleAddComment(lineNumber)}
                            disabled={!commentText.trim()}
                            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded"
                          >
                            Add Comment
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function InlineCommentForm({
  lineNumber,
  onSubmit,
  onCancel,
  existingComments,
  onResolveComment,
}: {
  lineNumber: number;
  onSubmit: (text: string) => Promise<void>;
  onCancel: () => void;
  existingComments: Comment[];
  onResolveComment: (id: string, resolved: boolean) => Promise<void>;
}) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(text);
      setText('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-64 right-0 bg-gray-800 border-t border-gray-700 shadow-lg p-4 z-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">Comment on line {lineNumber}</span>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-white text-sm"
          >
            ✕ Close
          </button>
        </div>

        {/* Show existing comments */}
        {existingComments.length > 0 && (
          <div className="mb-3 space-y-2">
            {existingComments.map((comment) => (
              <div
                key={comment.id}
                className={`p-2 rounded ${comment.isResolved ? 'bg-gray-700/50' : 'bg-gray-700'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">
                    {comment.author?.name || 'Unknown'}
                  </span>
                  <button
                    onClick={() => onResolveComment(comment.id, !comment.isResolved)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {comment.isResolved ? 'Unresolve' : 'Resolve'}
                  </button>
                </div>
                <p className={`text-sm ${comment.isResolved ? 'text-gray-500' : 'text-gray-200'}`}>
                  {comment.text}
                </p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={text}
            onInput={(e) => setText((e.target as HTMLInputElement).value)}
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            placeholder="Add a comment..."
            autoFocus
          />
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded"
          >
            {submitting ? 'Adding...' : 'Add Comment'}
          </button>
        </form>
      </div>
    </div>
  );
}
