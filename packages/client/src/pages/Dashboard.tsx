/**
 * Dashboard page - Premium session management UI
 */

import { useState } from 'hono/jsx';
import { EmptyState } from '@/components/common';
import { GitHubIcon, PlusIcon } from '@/components/icons';
import { AppShell, UserDropdown } from '@/components/layout';
import { SessionCard } from '@/components/session';
import { Button, Spinner } from '@/components/ui';
import { useAuth } from '../hooks/useAuth';
import { useGitHub } from '../hooks/useGitHub';
import { useOAuthCallback } from '../hooks/useOAuthCallback';
import { useSessions } from '../hooks/useSession';
import { navigate } from '../router';
import { ImportPRDialog } from './dashboard/ImportPRDialog';
import { NewSessionDialog } from './dashboard/NewSessionDialog';

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

  // Handle OAuth callback query params
  useOAuthCallback({
    onSuccess: refreshGitHub,
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCreateSession = async (data: {
    title: string;
    description?: string;
    isPublic?: boolean;
  }) => {
    const session = await createSession(data);
    setShowNewForm(false);
    if (session) {
      navigate(`/session/${session.id}`);
    }
  };

  const handleImport = async (sessionId: string) => {
    setShowImportForm(false);
    await refetch();
    navigate(`/session/${sessionId}`);
  };

  return (
    <AppShell
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
      <div className="max-w-6xl mx-auto px-6 py-8 sm:py-10 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Your Sessions
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {sessions.length > 0
                ? `${sessions.length} session${sessions.length !== 1 ? 's' : ''}`
                : 'Create or import a session to get started'}
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={() => setShowImportForm(true)}
              className="flex-1 sm:flex-initial justify-center rounded-lg glass border-border/50 hover:bg-accent/40"
            >
              <GitHubIcon className="size-4 mr-2" />
              <span className="hidden sm:inline">Import from GitHub</span>
              <span className="sm:hidden">Import PR</span>
            </Button>
            <Button
              onClick={() => setShowNewForm(true)}
              className="flex-1 sm:flex-initial justify-center rounded-lg bg-primary hover:bg-primary/90 glow-sm"
            >
              <PlusIcon className="size-4 mr-2" />
              New Session
            </Button>
          </div>
        </div>

        <NewSessionDialog
          open={showNewForm}
          onOpenChange={setShowNewForm}
          onCreate={handleCreateSession}
        />

        <ImportPRDialog
          open={showImportForm}
          onOpenChange={setShowImportForm}
          onImport={handleImport}
          githubConnected={githubConnected}
          onConnectGitHub={connectGitHub}
        />

        <SessionsList
          sessions={sessions}
          loading={loading}
          onDeleteSession={deleteSession}
          onCreateNew={() => setShowNewForm(true)}
        />
      </div>
    </AppShell>
  );
}

function SessionsList({
  sessions,
  loading,
  onDeleteSession,
  onCreateNew,
}: {
  sessions: any[];
  loading: boolean;
  onDeleteSession: (id: string) => void;
  onCreateNew: () => void;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Spinner className="size-6" />
        <p className="text-sm text-muted-foreground">Loading sessions...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="size-12 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        }
        title="No sessions yet"
        description="Create a new session or import a pull request from GitHub to get started."
        actionLabel="Create your first session"
        onAction={onCreateNew}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sessions.map((session, i) => (
        <div
          key={session.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'backwards' }}
        >
          <SessionCard
            session={session}
            onDelete={() => onDeleteSession(session.id)}
          />
        </div>
      ))}
    </div>
  );
}
