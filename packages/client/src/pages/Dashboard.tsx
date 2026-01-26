/**
 * Dashboard page - list and create sessions
 */

import { useEffect, useState } from 'hono/jsx';
import { Button, Spinner, toast } from '@/components/ui';
import { GitHubIcon } from '@/components/icons';
import { EmptyState } from '@/components/common';
import { PageHeader, UserMenu, GitHubStatus } from '@/components/layout';
import { SessionCard } from '@/components/session';
import { apiClient } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useGitHub } from '../hooks/useGitHub';
import { useSessions } from '../hooks/useSession';
import { navigate } from '../router';
import { NewSessionDialog } from './dashboard/NewSessionDialog';
import { ImportPRDialog } from './dashboard/ImportPRDialog';

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
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const githubConnectedParam = params.get('github_connected');
    const githubError = params.get('github_error');

    if (githubConnectedParam === 'true') {
      toast.success('GitHub account connected successfully!');
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
      toast.error(errorMessages[githubError] || `GitHub error: ${githubError}`);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [refreshGitHub]);

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
    navigate(`/session/${session.id}`);
  };

  const handleImport = async (sessionId: string) => {
    setShowImportForm(false);
    await refetch();
    navigate(`/session/${sessionId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader>
        <UserMenu email={user?.email || ''} onLogout={handleLogout}>
          <GitHubStatus
            connected={githubConnected}
            username={githubUsername}
            onConnect={connectGitHub}
            onDisconnect={disconnectGitHub}
          />
        </UserMenu>
      </PageHeader>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
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
      </main>
    </div>
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
