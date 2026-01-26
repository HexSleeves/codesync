/**
 * Session page - the main code review interface
 * Mobile-first design with collapsible sidebars
 */

import type { Comment } from '@codesync/shared';
import { useCallback, useEffect, useMemo, useState } from 'hono/jsx';
import { InlineCommentPanel } from '@/components/comment';
import { PageError, PageLoading } from '@/components/common';
import { DiffViewer } from '@/components/Diff';
import { CloseIcon, MessageIcon, ShareIcon, SidebarIcon, UsersIcon } from '@/components/icons';
import { AppShell, UserDropdown } from '@/components/layout';
import {
  ChatPanel,
  FileHeader,
  FileTree,
  OnlineUsers,
  SessionStatusBadge,
} from '@/components/session';
import { Button } from '@/components/ui';
import { KeyboardShortcutsModal, ShareSessionModal } from '@/components/modals';
import { useAuth } from '../hooks/useAuth';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useComments } from '../hooks/useComments';
import { useGitHub } from '../hooks/useGitHub';
import { useSession } from '../hooks/useSession';
import { useWebSocket } from '../hooks/useWebSocket';
import { navigate } from '../router';
import { useSettingsStore } from '../stores/settings';
import { CodeViewer } from './session/CodeViewer';

interface SessionPageProps {
  sessionId: string;
}

export function SessionPage({ sessionId }: SessionPageProps) {
  const { user, logout } = useAuth();
  const { session, files, loading, error, markFileReviewed } = useSession(sessionId);
  const {
    connected: githubConnected,
    username: githubUsername,
    connect: connectGitHub,
    disconnect: disconnectGitHub,
  } = useGitHub();
  // Get default settings from store
  const defaultViewMode = useSettingsStore((s) => s.defaultViewMode);
  const defaultDiffMode = useSettingsStore((s) => s.defaultDiffMode);

  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'code' | 'diff'>(defaultViewMode);
  const [diffMode, setDiffMode] = useState<'unified' | 'split'>(defaultDiffMode);
  const [activeCommentLine, setActiveCommentLine] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showFileTree, setShowFileTree] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);

  // WebSocket for real-time collaboration
  const { connected, onlineUsers, cursors, chatMessages, sendCursor, sendChat } =
    useWebSocket(sessionId);

  // File navigation helpers
  const selectNextFile = useCallback(() => {
    if (files.length === 0) return;
    const currentIndex = files.findIndex((f) => f.id === selectedFileId);
    const nextIndex = currentIndex < files.length - 1 ? currentIndex + 1 : 0;
    setSelectedFileId(files[nextIndex].id);
  }, [files, selectedFileId]);

  const selectPrevFile = useCallback(() => {
    if (files.length === 0) return;
    const currentIndex = files.findIndex((f) => f.id === selectedFileId);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : files.length - 1;
    setSelectedFileId(files[prevIndex].id);
  }, [files, selectedFileId]);

  // Keyboard shortcuts
  const { showShortcutsModal, setShowShortcutsModal } = useKeyboardShortcuts({
    onNextFile: selectNextFile,
    onPrevFile: selectPrevFile,
    onToggleFileTree: () => setShowFileTree((prev) => !prev),
    onToggleChat: () => setShowChat((prev) => !prev),
    onToggleDiffMode: () => setDiffMode((prev) => (prev === 'unified' ? 'split' : 'unified')),
    onToggleViewMode: () => setViewMode((prev) => (prev === 'diff' ? 'code' : 'diff')),
    onMarkReviewed: () => {
      if (selectedFile) {
        markFileReviewed(selectedFile.id, !selectedFile.isReviewed);
      }
    },
    enabled: !loading && !error,
  });

  const selectedFile = files.find((f) => f.id === selectedFileId) || null;
  const { commentsByLine, addComment, resolveComment } = useComments(selectedFileId);

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

  // Sync share token from session
  useEffect(() => {
    if (session?.shareToken) {
      setShareToken(session.shareToken);
    }
  }, [session?.shareToken]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return <PageLoading message="Loading session..." />;
  }

  if (error || !session) {
    return (
      <PageError
        title="Session Not Found"
        message={error || "This session doesn't exist."}
        actionLabel="Go to Dashboard"
        actionHref="/dashboard"
      />
    );
  }

  const handleAddComment = async (text: string) => {
    if (activeCommentLine !== null) {
      await addComment(text, activeCommentLine);
      setActiveCommentLine(null);
    }
  };

  // Send cursor position when file or line changes
  const handleLineHover = (lineNumber: number) => {
    if (selectedFileId) {
      sendCursor(selectedFileId, lineNumber, 0);
    }
  };

  return (
    <AppShell
      fullHeight
      breadcrumbs={[{ label: session.title }]}
      headerCenter={
        <div className="flex items-center gap-3">
          {/* Sidebar toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFileTree(!showFileTree)}
            aria-label={showFileTree ? 'Hide sidebar' : 'Show sidebar'}
            className="gap-1.5"
          >
            <SidebarIcon className="size-4" />
            <span className="hidden lg:inline">Files</span>
          </Button>

          {/* Session status */}
          <SessionStatusBadge status={session.status} />

          {/* Share button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShareModal(true)}
            className="gap-1.5"
          >
            <ShareIcon className="size-4" />
            <span className="hidden lg:inline">Share</span>
          </Button>

          {/* Online users indicator */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <div className={`size-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <UsersIcon className="size-4" />
            <span className="tabular-nums">{onlineUsers.length}</span>
          </div>
        </div>
      }
      headerRight={
        <UserDropdown
          email={user?.email || ''}
          name={user?.githubUsername || undefined}
          githubUsername={githubUsername || undefined}
          githubConnected={githubConnected}
          onLogout={handleLogout}
          onConnectGitHub={connectGitHub}
          onDisconnectGitHub={disconnectGitHub}
        />
      }
    >
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: File Tree */}
        {showFileTree && (
          <aside className="w-64 border-r border-border flex-col bg-card hidden md:flex shrink-0">
            <OnlineUsers users={onlineUsers} connected={connected} />
            <div className="flex-1 overflow-hidden">
              <FileTree
                files={files}
                selectedFileId={selectedFileId}
                onFileSelect={setSelectedFileId}
              />
            </div>
          </aside>
        )}

        {/* Mobile File Tree Drawer */}
        {showFileTree && (
          <aside className="absolute inset-y-0 left-0 z-30 w-64 border-r border-border flex flex-col bg-card md:hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-sm font-medium">Files</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFileTree(false)}
                aria-label="Close sidebar"
              >
                <CloseIcon className="size-4" />
              </Button>
            </div>
            <OnlineUsers users={onlineUsers} connected={connected} />
            <div className="flex-1 overflow-hidden">
              <FileTree
                files={files}
                selectedFileId={selectedFileId}
                onFileSelect={(id) => {
                  setSelectedFileId(id);
                  setShowFileTree(false);
                }}
              />
            </div>
          </aside>
        )}

        {/* Overlay for mobile when sidebar is open */}
        {showFileTree && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setShowFileTree(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {selectedFile ? (
            <>
              <FileHeader
                file={selectedFile}
                viewMode={viewMode}
                diffMode={diffMode}
                onViewModeChange={setViewMode}
                onDiffModeChange={setDiffMode}
                onToggleReviewed={() => markFileReviewed(selectedFile.id, !selectedFile.isReviewed)}
              />

              <div className="flex-1 overflow-auto relative">
                {viewMode === 'diff' ? (
                  <div className="flex flex-col h-full">
                    <DiffViewer
                      file={selectedFile}
                      mode={diffMode}
                      comments={commentsMap}
                      onLineClick={(lineNumber) => setActiveCommentLine(lineNumber)}
                      onLineHover={handleLineHover}
                      cursors={cursors}
                      currentUserId={user?.id}
                    />
                    {activeCommentLine !== null && (
                      <InlineCommentPanel
                        lineNumber={activeCommentLine}
                        comments={(commentsByLine[activeCommentLine] || []) as Comment[]}
                        onSubmit={handleAddComment}
                        onClose={() => setActiveCommentLine(null)}
                        onResolve={resolveComment}
                      />
                    )}
                  </div>
                ) : (
                  <CodeViewer
                    file={selectedFile}
                    commentsByLine={commentsByLine}
                    onAddComment={addComment}
                    onResolveComment={resolveComment}
                  />
                )}
              </div>
            </>
          ) : (
            <EmptyFileSelection />
          )}
        </main>

        {/* Right Sidebar: Chat */}
        {showChat && (
          <aside className="absolute md:relative inset-y-0 right-0 z-30 w-full sm:w-72 border-l border-border flex flex-col bg-card">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-sm font-medium">Chat</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChat(false)}
                aria-label="Close chat"
              >
                <CloseIcon className="size-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatPanel messages={chatMessages} onSend={sendChat} connected={connected} />
            </div>
          </aside>
        )}

        {/* Overlay for mobile when chat is open */}
        {showChat && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setShowChat(false)}
          />
        )}

        {/* Chat toggle button */}
        {!showChat && (
          <Button
            variant="outline"
            size="sm"
            className="fixed bottom-4 right-4 z-10 gap-1.5"
            onClick={() => setShowChat(true)}
          >
            <MessageIcon className="size-4" />
            <span className="hidden sm:inline">Chat</span>
          </Button>
        )}
      </div>

      {/* Keyboard shortcuts modal */}
      <KeyboardShortcutsModal
        open={showShortcutsModal}
        onOpenChange={setShowShortcutsModal}
      />

      {/* Share session modal */}
      <ShareSessionModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        sessionId={sessionId}
        shareToken={shareToken}
        onShareTokenChange={setShareToken}
      />
    </AppShell>
  );
}

function EmptyFileSelection() {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <p className="text-lg">Select a file to review</p>
        <p className="text-sm mt-2">Choose a file from the sidebar</p>
      </div>
    </div>
  );
}
