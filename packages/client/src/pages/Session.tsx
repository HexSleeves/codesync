/**
 * Session page - the main code review interface
 * Mobile-first design with collapsible sidebars
 */

import { useCallback, useEffect, useState } from 'hono/jsx';
import { PageError, PageLoading } from '@/components/common';
import { MessageIcon } from '@/components/icons';
import { AppShell, UserDropdown } from '@/components/layout';
import { KeyboardShortcutsModal, ShareSessionModal } from '@/components/modals';
import { ChatSidebar, FileTreeSidebar, MainContent, SessionControls } from '@/components/session';
import { Button } from '@/components/ui';
import { useAuth } from '../hooks/useAuth';
import { useComments } from '../hooks/useComments';
import { useGitHub } from '../hooks/useGitHub';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useSession } from '../hooks/useSession';
import { useWebSocket } from '../hooks/useWebSocket';
import { navigate } from '../router';
import { useSettingsStore } from '../stores/settings';

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

  // UI state
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

  // Comments for selected file
  const selectedFile = files.find((f) => f.id === selectedFileId) || null;
  const { commentsByLine, addComment, resolveComment } = useComments(selectedFileId);

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

  const handleLineHover = (lineNumber: number) => {
    if (selectedFileId) {
      sendCursor(selectedFileId, lineNumber, 0);
    }
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

  return (
    <AppShell
      fullHeight
      breadcrumbs={[{ label: session.title }]}
      headerCenter={
        <SessionControls
          status={session.status}
          showFileTree={showFileTree}
          onToggleFileTree={() => setShowFileTree(!showFileTree)}
          onShare={() => setShowShareModal(true)}
          connected={connected}
          onlineUsers={onlineUsers}
        />
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
        <FileTreeSidebar
          open={showFileTree}
          onClose={() => setShowFileTree(false)}
          files={files}
          selectedFileId={selectedFileId}
          onFileSelect={setSelectedFileId}
          onlineUsers={onlineUsers}
          connected={connected}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <MainContent
            file={selectedFile}
            viewMode={viewMode}
            diffMode={diffMode}
            onViewModeChange={setViewMode}
            onDiffModeChange={setDiffMode}
            onToggleReviewed={() =>
              selectedFile && markFileReviewed(selectedFile.id, !selectedFile.isReviewed)
            }
            commentsByLine={commentsByLine}
            activeCommentLine={activeCommentLine}
            onLineClick={setActiveCommentLine}
            onCloseCommentPanel={() => setActiveCommentLine(null)}
            onAddComment={addComment}
            onResolveComment={resolveComment}
            onLineHover={handleLineHover}
            cursors={cursors}
            currentUserId={user?.id}
          />
        </main>

        {/* Right Sidebar: Chat */}
        <ChatSidebar
          open={showChat}
          onClose={() => setShowChat(false)}
          messages={chatMessages}
          onSend={sendChat}
          connected={connected}
        />

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

      {/* Modals */}
      <KeyboardShortcutsModal open={showShortcutsModal} onOpenChange={setShowShortcutsModal} />
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
