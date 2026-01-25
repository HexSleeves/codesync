/**
 * Session page - the main code review interface
 */

import type { Comment } from '@codesync/shared';
import { useEffect, useMemo, useState } from 'hono/jsx';
import { Button } from '@/components/ui';
import { PageLoading, PageError } from '@/components/common';
import { SessionStatusBadge, FileTree, FileHeader } from '@/components/session';
import { InlineCommentPanel } from '@/components/comment';
import { DiffViewer } from '@/components/Diff';
import { useAuth } from '../hooks/useAuth';
import { useComments } from '../hooks/useComments';
import { useSession } from '../hooks/useSession';
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

  return (
    <div className="h-screen bg-background flex flex-col">
      <SessionHeader session={session} userEmail={user?.email} />

      <div className="flex-1 flex overflow-hidden">
        <FileTree
          files={files}
          selectedFileId={selectedFileId}
          onFileSelect={setSelectedFileId}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
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

              <div className="flex-1 overflow-auto">
                {viewMode === 'diff' ? (
                  <div className="flex flex-col h-full">
                    <DiffViewer
                      file={selectedFile}
                      mode={diffMode}
                      comments={commentsMap}
                      onLineClick={(lineNumber) => setActiveCommentLine(lineNumber)}
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
      </div>
    </div>
  );
}

function SessionHeader({ session, userEmail }: { session: any; userEmail?: string }) {
  return (
    <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            ←
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-foreground">{session.title}</h1>
        <SessionStatusBadge status={session.status} />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground text-sm">{userEmail}</span>
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
