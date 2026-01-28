/**
 * Dashboard page - list and create sessions
 */

import { useState } from 'hono/jsx';
import { EmptyState } from '@/components/common';
import { GitHubIcon } from '@/components/icons';
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
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Your Sessions</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={() => setShowImportForm(true)}
              className="w-full sm:w-auto justify-center"
            >
              <GitHubIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="hidden sm:inline">Import from GitHub</span>
              <span className="sm:hidden">Import PR</span>
            </Button>
            <Button
              onClick={() => setShowNewForm(true)}
              className="w-full sm:w-auto justify-center"
            >
              + New Session
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
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <EmptyState
        title="No sessions yet"
        actionLabel="Create your first session"
        onAction={onCreateNew}
      />
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          onDelete={() => onDeleteSession(session.id)}
        />
      ))}
    </div>
  );
}
