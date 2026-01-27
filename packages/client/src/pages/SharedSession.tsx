/**
 * Shared Session Page - Public read-only view of a shared session
 * No authentication required, accessible via share token
 */

import type { File, Session } from '@codesync/shared';
import { useEffect, useState } from 'hono/jsx';
import { apiCall } from '@/api/client';
import { PageError, PageLoading } from '@/components/common';
import { ShareIcon, SidebarIcon } from '@/components/icons';
import { FileTreeSidebar, MainContent, SessionStatusBadge } from '@/components/session';
import { Button } from '@/components/ui';
import { Link } from '@/router';

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
      <SharedSessionHeader
        title={session.title}
        status={session.status}
        showFileTree={showFileTree}
        onToggleFileTree={() => setShowFileTree(!showFileTree)}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: File Tree */}
        <FileTreeSidebar
          open={showFileTree}
          onClose={() => setShowFileTree(false)}
          files={files}
          selectedFileId={selectedFileId}
          onFileSelect={setSelectedFileId}
          headerContent={<span className="text-sm font-medium text-muted-foreground">Files</span>}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <MainContent
            file={selectedFile}
            viewMode="diff"
            diffMode={diffMode}
            onViewModeChange={() => {}}
            onDiffModeChange={setDiffMode}
            onToggleReviewed={() => {}}
            commentsByLine={{}}
            activeCommentLine={null}
            onLineClick={() => {}}
            onCloseCommentPanel={() => {}}
            onAddComment={async () => {}}
            onResolveComment={async () => {}}
            readOnly
          />
        </main>
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface SharedSessionHeaderProps {
  title: string;
  status: 'draft' | 'in_review' | 'approved' | 'merged';
  showFileTree: boolean;
  onToggleFileTree: () => void;
}

function SharedSessionHeader({
  title,
  status,
  showFileTree,
  onToggleFileTree,
}: SharedSessionHeaderProps) {
  return (
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
            <span className="text-sm text-foreground font-medium truncate">{title}</span>
          </div>
        </div>

        {/* Center: Controls */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onToggleFileTree} className="gap-1.5">
            <SidebarIcon className="size-4" />
            <span className="hidden lg:inline">Files</span>
          </Button>

          <SessionStatusBadge status={status} />

          <div className="px-2 py-1 text-xs rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
            Read-only
          </div>
        </div>

        {/* Right: Sign in CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/login">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
