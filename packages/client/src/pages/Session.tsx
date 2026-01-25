/**
 * Session page - the main code review interface
 */

import type { Comment, File } from '@codesync/shared';
import { useEffect, useMemo, useState } from 'hono/jsx';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Select,
  SelectOption,
  Spinner,
  Textarea,
} from '@/components/ui';
import { DiffViewer } from '../components/Diff';
import { useAuth } from '../hooks/useAuth';
import { useComments } from '../hooks/useComments';
import { useSession } from '../hooks/useSession';
import { Link } from '../router';

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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Session Not Found</h1>
            <p className="text-muted-foreground mb-6">{error || "This session doesn't exist."}</p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusVariants: Record<string, 'secondary' | 'warning' | 'success' | 'default'> = {
    draft: 'secondary',
    in_review: 'warning',
    approved: 'success',
    merged: 'default',
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              ←
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">{session.title}</h1>
          <Badge variant={statusVariants[session.status] || 'secondary'}>
            {session.status.replace('_', ' ')}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-sm">{user?.email}</span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File tree sidebar */}
        <aside className="w-64 border-r border-border bg-card overflow-y-auto shrink-0">
          <div className="p-3 border-b border-border">
            <h2 className="text-sm font-medium text-muted-foreground">Files ({files.length})</h2>
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
              <div className="border-b border-border bg-card px-4 py-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-muted-foreground">
                    {selectedFile.path}
                  </span>
                  {selectedFile.isReviewed && <Badge variant="success">✓ Reviewed</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={selectedFile.isReviewed ? 'secondary' : 'default'}
                    size="sm"
                    onClick={() => markFileReviewed(selectedFile.id, !selectedFile.isReviewed)}
                  >
                    {selectedFile.isReviewed ? 'Unmark Reviewed' : 'Mark Reviewed'}
                  </Button>
                  <Select
                    value={viewMode}
                    onChange={(e) =>
                      setViewMode((e.target as HTMLSelectElement).value as 'code' | 'diff')
                    }
                    className="w-32"
                  >
                    <SelectOption value="diff">Diff View</SelectOption>
                    <SelectOption value="code">Code View</SelectOption>
                  </Select>
                  {viewMode === 'diff' && (
                    <Select
                      value={diffMode}
                      onChange={(e) =>
                        setDiffMode((e.target as HTMLSelectElement).value as 'unified' | 'split')
                      }
                      className="w-28"
                    >
                      <SelectOption value="unified">Unified</SelectOption>
                      <SelectOption value="split">Split</SelectOption>
                    </Select>
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
                      onLineClick={(lineNumber, _side) => {
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
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
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
    if (file.isDeleted) return <span className="text-destructive">D</span>;
    if (file.isModified) return <span className="text-yellow-400">M</span>;
    return null;
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-accent ${
        isSelected ? 'bg-accent text-foreground' : 'text-muted-foreground'
      }`}
    >
      <span className="text-xs font-mono w-4">{getStatusIcon()}</span>
      <span className="truncate text-sm">{file.name}</span>
      {file.isReviewed && <span className="ml-auto text-green-400 text-xs">✓</span>}
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

  const content =
    viewMode === 'diff' && file.originalContent ? file.content || '' : file.content || '';

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
                <tr key={`line-${lineNumber}`} className="hover:bg-accent group">
                  <td className="w-12 px-2 py-0 text-right text-muted-foreground select-none border-r border-border sticky left-0 bg-background">
                    {lineNumber}
                  </td>
                  <td className="w-8 px-1 py-0 text-center">
                    <button
                      onClick={() => setActiveCommentLine(lineNumber)}
                      className="opacity-0 group-hover:opacity-100 text-primary hover:text-primary/80"
                    >
                      +
                    </button>
                  </td>
                  <td className="px-4 py-0 whitespace-pre">{line || ' '}</td>
                  <td className="w-8 px-1">
                    {hasComments && <span className="text-primary">💬 {lineComments.length}</span>}
                  </td>
                </tr>

                {/* Comments for this line */}
                {hasComments && (
                  <tr key={`comments-${lineNumber}`}>
                    <td colSpan={4} className="bg-card border-l-2 border-primary">
                      <div className="p-3">
                        {lineComments.map((comment: any) => (
                          <Card
                            key={comment.id}
                            className={`mb-2 ${comment.isResolved ? 'opacity-60' : ''}`}
                          >
                            <CardContent className="p-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-muted-foreground">
                                  {comment.author?.name || 'Unknown'}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs"
                                  onClick={() => onResolveComment(comment.id, !comment.isResolved)}
                                >
                                  {comment.isResolved ? 'Unresolve' : 'Resolve'}
                                </Button>
                              </div>
                              <p
                                className={`text-sm ${
                                  comment.isResolved ? 'text-muted-foreground' : 'text-foreground'
                                }`}
                              >
                                {comment.text}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}

                {/* Comment input for this line */}
                {activeCommentLine === lineNumber && (
                  <tr key={`input-${lineNumber}`}>
                    <td colSpan={4} className="bg-card border-l-2 border-green-500">
                      <div className="p-3">
                        <Textarea
                          value={commentText}
                          onInput={(e) => setCommentText((e.target as HTMLTextAreaElement).value)}
                          placeholder="Add a comment..."
                          rows={3}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveCommentLine(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAddComment(lineNumber)}
                            disabled={!commentText.trim()}
                          >
                            Add Comment
                          </Button>
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
    <div className="fixed bottom-0 left-64 right-0 bg-card border-t border-border shadow-lg p-4 z-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Comment on line {lineNumber}</span>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            ✕ Close
          </Button>
        </div>

        {/* Show existing comments */}
        {existingComments.length > 0 && (
          <div className="mb-3 space-y-2">
            {existingComments.map((comment) => (
              <Card key={comment.id} className={comment.isResolved ? 'opacity-60' : ''}>
                <CardContent className="p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      {comment.author?.name || 'Unknown'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => onResolveComment(comment.id, !comment.isResolved)}
                    >
                      {comment.isResolved ? 'Unresolve' : 'Resolve'}
                    </Button>
                  </div>
                  <p
                    className={`text-sm ${
                      comment.isResolved ? 'text-muted-foreground' : 'text-foreground'
                    }`}
                  >
                    {comment.text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            type="text"
            value={text}
            onInput={(e) => setText((e.target as HTMLInputElement).value)}
            placeholder="Add a comment..."
            className="flex-1"
          />
          <Button type="submit" disabled={!text.trim() || submitting}>
            {submitting ? 'Adding...' : 'Add Comment'}
          </Button>
        </form>
      </div>
    </div>
  );
}
