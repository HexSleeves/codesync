/**
 * Session page - the main code review interface
 * Mobile-first design with collapsible sidebars
 */

import type { Comment } from '@codesync/shared';
import { useEffect, useMemo, useState } from 'hono/jsx';
import { Button } from '@/components/ui';
import { PageLoading, PageError } from '@/components/common';
import {
  SessionStatusBadge,
  FileTree,
  FileHeader,
  OnlineUsers,
  ChatPanel,
} from '@/components/session';
import { InlineCommentPanel } from '@/components/comment';
import { DiffViewer } from '@/components/Diff';
import { useAuth } from '../hooks/useAuth';
import { useComments } from '../hooks/useComments';
import { useSession } from '../hooks/useSession';
import { useWebSocket } from '../hooks/useWebSocket';
import { Link } from '../router';
import { CodeViewer } from './session/CodeViewer';

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
  const [showChat, setShowChat] = useState(false);
  const [showFileTree, setShowFileTree] = useState(false);

  // WebSocket for real-time collaboration
  const { connected, onlineUsers, cursors, chatMessages, sendCursor, sendChat } =
    useWebSocket(sessionId);

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
    <div className="h-screen bg-background flex flex-col">
      <SessionHeader
        session={session}
        userEmail={user?.email}
        connected={connected}
        onlineCount={onlineUsers.length}
        showFileTree={showFileTree}
        onToggleFileTree={() => setShowFileTree(!showFileTree)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Online Users + File Tree */}
        {/* On desktop: always visible. On mobile: shown when showFileTree is true */}
        <aside
          className={`
            w-64 border-r border-border flex flex-col bg-card
            hidden md:flex
          `}
        >
          <OnlineUsers users={onlineUsers} connected={connected} />
          <div className="flex-1 overflow-hidden">
            <FileTree
              files={files}
              selectedFileId={selectedFileId}
              onFileSelect={setSelectedFileId}
            />
          </div>
        </aside>

        {/* Mobile File Tree Drawer */}
        {showFileTree && (
          <aside className="absolute inset-y-0 left-0 z-30 w-64 border-r border-border flex flex-col bg-card md:hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-sm font-medium">Files</span>
              <Button variant="ghost" size="sm" onClick={() => setShowFileTree(false)}>
                ✕
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

        {/* Right Sidebar: Chat - Slide-out on mobile */}
        {showChat && (
          <aside className="absolute md:relative inset-y-0 right-0 z-30 w-full sm:w-72 border-l border-border flex flex-col bg-card">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-sm font-medium">Chat</span>
              <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>
                ✕
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

        {/* Chat toggle button - visible when chat is hidden */}
        {!showChat && (
          <Button
            variant="outline"
            size="sm"
            className="fixed bottom-4 right-4 z-10"
            onClick={() => setShowChat(true)}
          >
            💬 Chat
          </Button>
        )}
      </div>
    </div>
  );
}

function SessionHeader({
  session,
  userEmail,
  connected,
  onlineCount,
  showFileTree,
  onToggleFileTree,
}: {
  session: any;
  userEmail?: string;
  connected: boolean;
  onlineCount: number;
  showFileTree: boolean;
  onToggleFileTree: () => void;
}) {
  return (
    <header className="border-b border-border bg-card px-2 sm:px-4 py-2 sm:py-3 shrink-0">
      <div className="flex items-center justify-between gap-2">
        {/* Left side */}
        <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-1">
          {/* Mobile file tree toggle */}
          <Button variant="ghost" size="sm" className="md:hidden px-2" onClick={onToggleFileTree}>
            ☰
          </Button>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="px-2 sm:px-3">
              ←
            </Button>
          </Link>
          <h1 className="text-sm sm:text-lg font-semibold text-foreground truncate min-w-0">
            {session.title}
          </h1>
          <SessionStatusBadge status={session.status} className="hidden sm:inline-flex shrink-0" />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Connection status indicator */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="hidden sm:inline">
              {connected ? `${onlineCount} online` : 'Connecting...'}
            </span>
          </div>
          <span className="text-muted-foreground text-xs sm:text-sm hidden sm:inline truncate max-w-[100px]">
            {userEmail}
          </span>
        </div>
      </div>
    </header>
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
