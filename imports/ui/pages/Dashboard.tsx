import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import type { MeteorUser, UserProfile, UserServices } from '../../types';
import { useMySessions } from '../hooks/useSession';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { NewSessionForm } from '../components/dashboard/NewSessionForm';
import { SessionCard } from '../components/dashboard/SessionCard';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [showNewSession, setShowNewSession] = useState(false);
  const { sessions, isLoading } = useMySessions();

  const user = useTracker(() => Meteor.user() as MeteorUser | null, []);
  const profile = user?.profile as UserProfile | undefined;
  const services = user?.services as UserServices | undefined;
  const userName = profile?.name || services?.github?.username || user?.emails?.[0]?.address || 'Anonymous';

  const handleLogout = () => {
    Meteor.logout(() => navigate('/'));
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-600">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span className="text-xl font-bold">CodeSync</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-gray-600 dark:text-gray-300">{userName}</span>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Your Sessions
          </h1>
          <Button onClick={() => setShowNewSession(true)}>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Session
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-xl p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No sessions yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first code review session to get started.
            </p>
            <Button onClick={() => setShowNewSession(true)}>
              Create Session
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map(session => (
              <SessionCard key={session._id} session={session} />
            ))}
          </div>
        )}
      </main>

      {/* New Session Modal */}
      <Modal
        isOpen={showNewSession}
        onClose={() => setShowNewSession(false)}
        title="Create New Session"
        size="lg"
      >
        <NewSessionForm onClose={() => setShowNewSession(false)} />
      </Modal>
    </div>
  );
};
