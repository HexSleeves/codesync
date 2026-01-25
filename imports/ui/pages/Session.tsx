import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { useFiles, useFile } from '../hooks/useFileContent';
import { useCommentsByLine } from '../hooks/useComments';
import { useCursors } from '../hooks/useCursors';
import { useSessionShortcuts } from '../hooks/useSessionShortcuts';
import { useNotifications } from '../hooks/useNotifications';
import { FileTree } from '../components/FileTree/FileTree';
import { CodeView } from '../components/CodeEditor/CodeView';
import { DiffViewer } from '../components/Diff/DiffViewer';
import { CommentThread } from '../components/Comments/CommentThread';
import { UserList } from '../components/Sidebar/UserList';
import { ChatPanel } from '../components/Sidebar/ChatPanel';
import { TopBar } from '../components/Header/TopBar';
import { KeyboardShortcutsModal } from '../components/common/KeyboardShortcutsModal';
import {
  FileHeader,
  EmptyFileState,
  FileUploader,
  SidebarToggle,
  LoadingState,
  InlineLoadingState,
  SessionNotFound,
} from '../components/session';

const RIGHT_SIDEBAR_WIDTH = 320;

export const SessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();

  // UI State
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'code' | 'diff'>('diff');
  const [diffMode, setDiffMode] = useState<'unified' | 'split'>('unified');
  const [commentLine, setCommentLine] = useState<number | null>(null);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Data subscriptions
  const { session, isLoading: sessionLoading } = useSession(sessionId);
  const { files, isLoading: filesLoading } = useFiles(sessionId);
  const { file: selectedFile, isLoading: fileLoading } = useFile(selectedFileId);
  const { commentsByLine } = useCommentsByLine(selectedFileId);
  const { cursors, updateCursor } = useCursors(sessionId, selectedFileId);

  // Keyboard shortcuts
  useSessionShortcuts({
    showKeyboardHelp,
    setShowKeyboardHelp,
    commentLine,
    setCommentLine,
    setDiffMode,
    setShowRightSidebar,
    selectedFileId,
    files,
  });

  // Enable notifications for mentions
  useNotifications(sessionId);

  // Handle line click to open comment panel
  const handleLineClick = useCallback((lineNumber: number) => {
    setCommentLine(lineNumber);
  }, []);

  // Handle cursor movement
  const handleCursorMove = useCallback(
    (line: number, column: number) => {
      updateCursor(line, column);
    },
    [updateCursor]
  );

  // Loading state
  if (sessionLoading || filesLoading) {
    return <LoadingState message="Loading session..." />;
  }

  // Session not found
  if (!session) {
    return <SessionNotFound />;
  }

  // Get root comments for the selected line
  const lineComments = commentLine ? commentsByLine.get(commentLine) || [] : [];

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Top bar */}
      <TopBar session={session} />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - File tree */}
        <aside className="w-64 shrink-0 border-r border-gray-700 bg-gray-800 flex flex-col">
          <FileTree
            files={files}
            selectedFileId={selectedFileId}
            onFileSelect={setSelectedFileId}
          />

          {/* File upload (only for manual sessions) */}
          {session.source.type === 'manual' && sessionId && <FileUploader sessionId={sessionId} />}
        </aside>

        {/* Center - Code/Diff view */}
        <main className="flex-1 overflow-hidden flex flex-col min-w-0">
          {selectedFile ? (
            <>
              <FileHeader
                file={selectedFile}
                viewMode={viewMode}
                diffMode={diffMode}
                onViewModeChange={setViewMode}
                onDiffModeChange={setDiffMode}
                onShowKeyboardHelp={() => setShowKeyboardHelp(true)}
              />

              {/* Code/Diff display */}
              <div className="flex-1 overflow-auto">
                {fileLoading ? (
                  <InlineLoadingState />
                ) : viewMode === 'code' ? (
                  <CodeView
                    file={selectedFile}
                    comments={commentsByLine}
                    cursors={cursors}
                    onLineClick={handleLineClick}
                    onCursorMove={handleCursorMove}
                  />
                ) : (
                  <DiffViewer
                    file={selectedFile}
                    mode={diffMode}
                    comments={commentsByLine}
                    onLineClick={handleLineClick}
                  />
                )}
              </div>
            </>
          ) : (
            <EmptyFileState />
          )}
        </main>

        {/* Right sidebar - Users & Chat */}
        {showRightSidebar && (
          <aside className="w-80 shrink-0 border-l border-gray-700 bg-gray-800 flex flex-col">
            <UserList sessionId={sessionId!} />
            <ChatPanel sessionId={sessionId!} />
          </aside>
        )}

        {/* Toggle right sidebar button */}
        <SidebarToggle
          isOpen={showRightSidebar}
          onToggle={() => setShowRightSidebar(!showRightSidebar)}
          sidebarWidth={RIGHT_SIDEBAR_WIDTH}
        />
      </div>

      {/* Comment thread panel */}
      {commentLine !== null && selectedFileId && sessionId && (
        <CommentThread
          sessionId={sessionId}
          fileId={selectedFileId}
          lineNumber={commentLine}
          rootComments={lineComments}
          onClose={() => setCommentLine(null)}
        />
      )}

      {/* Keyboard shortcuts help modal */}
      <KeyboardShortcutsModal
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
    </div>
  );
};
