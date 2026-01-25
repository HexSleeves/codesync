/**
 * Dashboard page - list and create sessions
 */

import { useState, useEffect } from 'hono/jsx';
import { navigate, Link } from '../router';
import { useAuth } from '../hooks/useAuth';
import { useSessions } from '../hooks/useSession';
import { useGitHub } from '../hooks/useGitHub';
import { apiClient } from '../api/client';
import type { Session } from '@codesync/shared';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const { sessions, loading, createSession, deleteSession, refetch } = useSessions();
  const { connected: githubConnected, username: githubUsername, connect: connectGitHub, disconnect: disconnectGitHub, refresh: refreshGitHub } = useGitHub();
  const [showNewForm, setShowNewForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Handle OAuth callback query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const githubConnectedParam = params.get('github_connected');
    const githubError = params.get('github_error');

    if (githubConnectedParam === 'true') {
      setNotification({ type: 'success', message: 'GitHub account connected successfully!' });
      refreshGitHub();
      // Clean URL
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
      // Clean URL
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
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            CodeSync
          </Link>
          <div className="flex items-center gap-4">
            {githubConnected ? (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span className="text-green-400 text-sm">@{githubUsername}</span>
                <button
                  onClick={disconnectGitHub}
                  className="text-gray-500 hover:text-red-400 text-xs"
                  title="Disconnect GitHub"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={connectGitHub}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Connect GitHub
              </button>
            )}
            <span className="text-gray-400">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Notification banner */}
        {notification && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-green-900/30 border border-green-800 text-green-400'
                : 'bg-red-900/30 border border-red-800 text-red-400'
            }`}
          >
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-current opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Your Sessions</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportForm(true)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Import from GitHub
            </button>
            <button
              onClick={() => setShowNewForm(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              + New Session
            </button>
          </div>
        </div>

        {showNewForm && (
          <NewSessionForm
            onClose={() => setShowNewForm(false)}
            onCreate={async (data) => {
              const session = await createSession(data);
              setShowNewForm(false);
              navigate(`/session/${session.id}`);
            }}
          />
        )}

        {showImportForm && (
          <ImportPRForm
            onClose={() => setShowImportForm(false)}
            onImport={async (sessionId) => {
              setShowImportForm(false);
              await refetch();
              navigate(`/session/${sessionId}`);
            }}
            githubConnected={githubConnected}
            onConnectGitHub={connectGitHub}
          />
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No sessions yet</p>
            <button
              onClick={() => setShowNewForm(true)}
              className="text-blue-400 hover:text-blue-300"
            >
              Create your first session
            </button>
          </div>
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
  const statusColors = {
    draft: 'bg-gray-600',
    in_review: 'bg-yellow-600',
    approved: 'bg-green-600',
    merged: 'bg-purple-600',
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <Link
          href={`/session/${session.id}`}
          className="text-lg font-medium text-white hover:text-blue-400"
        >
          {session.title}
        </Link>
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded ${statusColors[session.status]} text-white`}
        >
          {session.status.replace('_', ' ')}
        </span>
      </div>

      {session.description && (
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
          {session.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{new Date(session.createdAt).toLocaleDateString()}</span>
        <button
          onClick={(e) => {
            e.preventDefault();
            if (confirm('Delete this session?')) onDelete();
          }}
          className="text-red-400 hover:text-red-300"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function NewSessionForm({
  onClose,
  onCreate,
}: {
  onClose: () => void;
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">New Session</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Session title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              placeholder="What are you reviewing?"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic((e.target as HTMLInputElement).checked)}
              className="w-4 h-4"
            />
            <label for="isPublic" className="text-gray-300 text-sm">
              Make this session public
            </label>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
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

function ImportPRForm({
  onClose,
  onImport,
  githubConnected,
  onConnectGitHub,
}: {
  onClose: () => void;
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
      
      const data = await res.json() as PRValidation;
      setValidation(data);
    } catch (err) {
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
    } catch (err) {
      setError('Failed to import PR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <h2 className="text-xl font-semibold text-white">Import from GitHub</h2>
        </div>

        <form onSubmit={handleImport} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Pull Request URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={prUrl}
                onInput={(e) => {
                  setPrUrl((e.target as HTMLInputElement).value);
                  setValidation(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://github.com/owner/repo/pull/123"
                required
              />
              <button
                type="button"
                onClick={handleValidate}
                disabled={!prUrl.trim() || validating}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {validating ? 'Checking...' : 'Validate'}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Supports formats: https://github.com/owner/repo/pull/123 or owner/repo#123
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {validation && (
            <div className="p-4 bg-gray-700/50 rounded-lg">
              {validation.needsAuth ? (
                <div className="text-yellow-400">
                  <p className="font-medium">GitHub Authentication Required</p>
                  <p className="text-sm mt-1 text-gray-400">
                    {validation.message || 'Connect your GitHub account to import pull requests.'}
                  </p>
                  <p className="text-xs mt-2 text-gray-500">
                    PR: {validation.prInfo?.owner}/{validation.prInfo?.repo}#{validation.prInfo?.prNumber}
                  </p>
                  {!githubConnected && (
                    <button
                      onClick={onConnectGitHub}
                      className="mt-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      Connect GitHub Account
                    </button>
                  )}
                </div>
              ) : validation.prData ? (
                <div>
                  <p className="font-medium text-white">{validation.prData.title}</p>
                  <div className="mt-2 space-y-1 text-sm text-gray-400">
                    <p>
                      <span className="text-gray-500">Author:</span> {validation.prData.author}
                    </p>
                    <p>
                      <span className="text-gray-500">Branch:</span> {validation.prData.branch}
                    </p>
                    <p>
                      <span className="text-gray-500">Status:</span>{' '}
                      <span className={validation.prData.state === 'open' ? 'text-green-400' : 'text-purple-400'}>
                        {validation.prData.state}
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-green-400">✓ Valid PR URL</p>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !prUrl.trim() || (validation?.needsAuth ?? false)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Importing...
                </>
              ) : (
                'Import PR'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
