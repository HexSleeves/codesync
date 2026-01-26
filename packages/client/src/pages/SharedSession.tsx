/**
 * Shared Session Page - Public read-only view of a shared session
 * No authentication required, accessible via share token
 */

import type { Comment, File, Session, CursorMessage } from '@codesync/shared';
import { useEffect, useMemo, useState } from 'hono/jsx';
import { PageError, PageLoading } from '@/components/common';
import { DiffViewer } from '@/components/Diff';
import { SidebarIcon, CloseIcon, ShareIcon } from '@/components/icons';
import { FileTree, SessionStatusBadge } from '@/components/session';
import { Button } from '@/components/ui';
import { apiCall } from '@/api/client';
import { Link } from '@/router';
import { cn } from '@/lib/utils';

interface SharedSessionPageProps {
  token: string;
}

export function SharedSessionPage({ token }: SharedSessionPageProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [diffMode, setDiffMode] = useState<'unified' | 'split'>('unified');
  const [showFileTree, setShowFileTree] = useState(true);

  const selectedFile = files.find((f) => f.id === selectedFileId) || null;

  // Fetch shared session data
  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await apiCall<{ session: Session; files: File[] }>(

          'GET',
          `/sessions/shared/${token}`
        );
        setSession(response.session);
        setFiles(response.files);
        
        // Select first file by default
        if (response.files.length > 0) {
          setSelectedFileId(response.files[0].id);
        }
      } catch (err) {
        console.error('Failed to load shared session:', err);
        setError('This shared session link is invalid or has been revoked.');
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [token]);

  // Empty comments map for read-only view
  const commentsMap = useMemo(() => new Map<number, Comment[]>(), []);

  if (loading) {
    return <PageLoading message="Loading shared session..." />;
  }

  if (error || !session) {
    return (
      <PageError
        title="Session Not Found"
        message={error || 'This shared session could not be found.'}
        actionLabel="Go to Login"
        actionHref="/login"
      />
    );
  }

  return (
    <div className="min-h-dvh h-dvh bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card shrink-0">
        <div className="h-14 px-4 flex items-center justify-between gap-4">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/login" className="flex items-center gap-2 shrink-0">
              <div className="size-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CS</span>
              </div>
              <span className="font-semibold text-foreground hidden sm:block">CodeSync</span>
            </Link>
            
            <div className="h-6 w-px bg-border hidden sm:block" />
            
            <div className="flex items-center gap-2 min-w-0">
              <ShareIcon className="size-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground font-medium truncate">
                {session.title}
              </span>
            </div>
          </div>

          {/* Center: Controls */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFileTree(!showFileTree)}
              className="gap-1.5"
            >
              <SidebarIcon className="size-4" />
              <span className="hidden lg:inline">Files</span>
            </Button>
            
            <SessionStatusBadge status={session.status} />
            
            <div className="px-2 py-1 text-xs rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
              Read-only
            </div>
          </div>

          {/* Right: Sign in CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/login">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: File Tree */}
        {showFileTree && (
          <aside className="w-64 border-r border-border flex-col bg-card hidden md:flex shrink-0">
            <div className="px-3 py-2 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">Files</span>
            </div>
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
              {/* File Header */}
              <div className="border-b border-border bg-card px-4 py-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-mono truncate">{selectedFile.path}</span>
                  {selectedFile.isAdded && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-500">
                      Added
                    </span>
                  )}
                  {selectedFile.isDeleted && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">
                      Deleted
                    </span>
                  )}
                  {selectedFile.isModified && !selectedFile.isAdded && !selectedFile.isDeleted && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">
                      Modified
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={diffMode === 'unified' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setDiffMode('unified')}
                  >
                    Unified
                  </Button>
                  <Button
                    variant={diffMode === 'split' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setDiffMode('split')}
                  >
                    Split
                  </Button>
                </div>
              </div>

              {/* Diff Viewer - Read-only */}
              <div className="flex-1 overflow-auto">
                <DiffViewer
                  file={selectedFile}
                  mode={diffMode}
                  comments={commentsMap}
                  onLineClick={() => {}}
                  onLineHover={() => {}}
                  cursors={new Map<string, CursorMessage>()}
                  currentUserId={undefined}
                />
              </div>
            </>
          ) : (
            <EmptyFileSelection />
          )}
        </main>
      </div>
    </div>
  );
}

function EmptyFileSelection() {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <p className="text-lg">Select a file to view</p>
        <p className="text-sm mt-2">Choose a file from the sidebar</p>
      </div>
    </div>
  );
}
