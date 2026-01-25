/**
 * Dashboard page - list and create sessions
 */

import { useState } from 'hono/jsx';
import { navigate, Link } from '../router';
import { useAuth } from '../hooks/useAuth';
import { useSessions } from '../hooks/useSession';
import type { Session } from '@codesync/shared';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const { sessions, loading, createSession, deleteSession } = useSessions();
  const [showNewForm, setShowNewForm] = useState(false);

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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Your Sessions</h1>
          <button
            onClick={() => setShowNewForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            + New Session
          </button>
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
