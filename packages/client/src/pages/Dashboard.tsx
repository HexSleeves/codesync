/**
 * Dashboard page - list and create sessions
 */

import type { Session } from '@codesync/shared';
import { useEffect, useState } from 'hono/jsx';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Separator,
  Spinner,
  Textarea,
} from '@/components/ui';
import { apiClient } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useGitHub } from '../hooks/useGitHub';
import { useSessions } from '../hooks/useSession';
import { Link, navigate } from '../router';

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export function DashboardPage() {
  const { user, logout } = useAuth();
  const { sessions, loading, createSession, deleteSession, refetch } = useSessions();
  const {
    connected: githubConnected,
    username: githubUsername,
    connect: connectGitHub,
    disconnect: disconnectGitHub,
    refresh: refreshGitHub,
  } = useGitHub();
  const [showNewForm, setShowNewForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Handle OAuth callback query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const githubConnectedParam = params.get('github_connected');
    const githubError = params.get('github_error');

    if (githubConnectedParam === 'true') {
      setNotification({ type: 'success', message: 'GitHub account connected successfully!' });
      refreshGitHub();
      window.history.replaceState({}, '', '/dashboard');
    } else if (githubError) {
      const errorMessages: Record<string, string> = {
        missing_params: 'OAuth callback missing parameters',
        invalid_state: 'Invalid OAuth state - please try again',
        session_expired: 'Session expired - please login and try again',
        token_error: 'Failed to get access token from GitHub',
        server_error: 'Server error during GitHub connection',
      };
      setNotification({
        type: 'error',
        message: errorMessages[githubError] || `GitHub error: ${githubError}`,
      });
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [refreshGitHub]);

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-foreground">
            CodeSync
          </Link>
          <div className="flex items-center gap-4">
            {githubConnected ? (
              <div className="flex items-center gap-2">
                <GitHubIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-green-400 text-sm">@{githubUsername}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={disconnectGitHub}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  title="Disconnect GitHub"
                >
                  ✕
                </Button>
              </div>
            ) : (
              <Button variant="secondary" size="sm" onClick={connectGitHub}>
                <GitHubIcon className="w-4 h-4 mr-2" />
                Connect GitHub
              </Button>
            )}
            <Separator orientation="vertical" className="h-6" />
            <span className="text-muted-foreground text-sm">{user?.email}</span>
            <Button variant="ghost" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Notification banner */}
        {notification && (
          <Alert
            variant={notification.type === 'error' ? 'destructive' : 'default'}
            className="mb-6"
          >
            <AlertDescription className="flex items-center justify-between">
              <span>{notification.message}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setNotification(null)}
              >
                ✕
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-foreground">Your Sessions</h1>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowImportForm(true)}>
              <GitHubIcon className="w-5 h-5 mr-2" />
              Import from GitHub
            </Button>
            <Button onClick={() => setShowNewForm(true)}>+ New Session</Button>
          </div>
        </div>

        <NewSessionDialog
          open={showNewForm}
          onOpenChange={setShowNewForm}
          onCreate={async (data) => {
            const session = await createSession(data);
            setShowNewForm(false);
            navigate(`/session/${session.id}`);
          }}
        />

        <ImportPRDialog
          open={showImportForm}
          onOpenChange={setShowImportForm}
          onImport={async (sessionId) => {
            setShowImportForm(false);
            await refetch();
            navigate(`/session/${sessionId}`);
          }}
          githubConnected={githubConnected}
          onConnectGitHub={connectGitHub}
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : sessions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">No sessions yet</p>
              <Button variant="link" onClick={() => setShowNewForm(true)}>
                Create your first session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onDelete={() => deleteSession(session.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SessionCard({ session, onDelete }: { session: Session; onDelete: () => void }) {
  const statusVariants: Record<string, 'secondary' | 'warning' | 'success' | 'default'> = {
    draft: 'secondary',
    in_review: 'warning',
    approved: 'success',
    merged: 'default',
  };

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <Link
            href={`/session/${session.id}`}
            className="text-lg font-medium text-foreground hover:text-primary"
          >
            {session.title}
          </Link>
          <Badge variant={statusVariants[session.status] || 'secondary'}>
            {session.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {session.description && (
          <CardDescription className="line-clamp-2 mb-3">{session.description}</CardDescription>
        )}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{new Date(session.createdAt).toLocaleDateString()}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={(e) => {
              e.preventDefault();
              if (confirm('Delete this session?')) onDelete();
            }}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NewSessionDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { title: string; description?: string; isPublic?: boolean }) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreate({ title, description: description || undefined, isPublic });
      setTitle('');
      setDescription('');
      setIsPublic(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Session</DialogTitle>
          <DialogDescription>Create a new code review session</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
              placeholder="Session title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
              placeholder="What are you reviewing?"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic((e.target as HTMLInputElement).checked)}
            />
            <Label htmlFor="isPublic" className="text-sm font-normal">
              Make this session public
            </Label>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title}>
              {loading ? 'Creating...' : 'Create Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface PRValidation {
  valid: boolean;
  prInfo?: {
    owner: string;
    repo: string;
    prNumber: number;
  };
  prData?: {
    title: string;
    body: string | null;
    state: string;
    author: string;
    branch: string;
    url: string;
  };
  needsAuth?: boolean;
  message?: string;
}

function ImportPRDialog({
  open,
  onOpenChange,
  onImport,
  githubConnected,
  onConnectGitHub,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (sessionId: string) => Promise<void>;
  githubConnected: boolean;
  onConnectGitHub: () => void;
}) {
  const [prUrl, setPrUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<PRValidation | null>(null);

  const handleValidate = async () => {
    if (!prUrl.trim()) return;

    setValidating(true);
    setError(null);
    setValidation(null);

    try {
      const res = await apiClient('/api/github/validate', {
        method: 'POST',
        body: JSON.stringify({ prUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to validate PR URL');
        return;
      }

      const data = (await res.json()) as PRValidation;
      setValidation(data);
    } catch (_err) {
      setError('Failed to validate PR URL');
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async (e: Event) => {
    e.preventDefault();
    if (!prUrl.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await apiClient('/api/github/import', {
        method: 'POST',
        body: JSON.stringify({ prUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || 'Failed to import PR');
        return;
      }

      await onImport(data.session.id);
    } catch (_err) {
      setError('Failed to import PR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <GitHubIcon className="w-6 h-6" />
            <DialogTitle>Import from GitHub</DialogTitle>
          </div>
          <DialogDescription>Import a pull request to review</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleImport} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prUrl">Pull Request URL</Label>
            <div className="flex gap-2">
              <Input
                id="prUrl"
                type="url"
                value={prUrl}
                onInput={(e) => {
                  setPrUrl((e.target as HTMLInputElement).value);
                  setValidation(null);
                }}
                placeholder="https://github.com/owner/repo/pull/123"
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleValidate}
                disabled={!prUrl.trim() || validating}
              >
                {validating ? 'Checking...' : 'Validate'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Supports formats: https://github.com/owner/repo/pull/123 or owner/repo#123
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {validation && (
            <Card>
              <CardContent className="pt-4">
                {validation.needsAuth ? (
                  <div>
                    <p className="font-medium text-yellow-400">GitHub Authentication Required</p>
                    <p className="text-sm mt-1 text-muted-foreground">
                      {validation.message || 'Connect your GitHub account to import pull requests.'}
                    </p>
                    <p className="text-xs mt-2 text-muted-foreground">
                      PR: {validation.prInfo?.owner}/{validation.prInfo?.repo}#
                      {validation.prInfo?.prNumber}
                    </p>
                    {!githubConnected && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={onConnectGitHub}
                        className="mt-3"
                      >
                        <GitHubIcon className="w-4 h-4 mr-2" />
                        Connect GitHub Account
                      </Button>
                    )}
                  </div>
                ) : validation.prData ? (
                  <div>
                    <p className="font-medium text-foreground">{validation.prData.title}</p>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p>
                        <span className="text-muted-foreground/70">Author:</span>{' '}
                        {validation.prData.author}
                      </p>
                      <p>
                        <span className="text-muted-foreground/70">Branch:</span>{' '}
                        {validation.prData.branch}
                      </p>
                      <p>
                        <span className="text-muted-foreground/70">Status:</span>{' '}
                        <Badge
                          variant={validation.prData.state === 'open' ? 'success' : 'secondary'}
                        >
                          {validation.prData.state}
                        </Badge>
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-green-400">✓ Valid PR URL</p>
                )}
              </CardContent>
            </Card>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !prUrl.trim() || (validation?.needsAuth ?? false)}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Importing...
                </>
              ) : (
                'Import PR'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
