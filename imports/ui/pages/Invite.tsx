import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { Button } from '../components/common/Button';
import type { MeteorError } from '../../types';

export const InvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'accepting' | 'error' | 'success'>('loading');
  const [error, setError] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Invalid invite link');
      return;
    }

    setStatus('accepting');
    Meteor.call('sessions.acceptInvite', token, (err: MeteorError | null, result?: string) => {
      if (err) {
        setStatus('error');
        setError(err.reason || err.message || 'Failed to accept invite');
      } else {
        setStatus('success');
        setSessionId(result ?? null);
        // Auto-redirect after 2 seconds
        setTimeout(() => {
          navigate(`/session/${result}`);
        }, 2000);
      }
    });
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full text-center">
        {status === 'loading' || status === 'accepting' ? (
          <>
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Accepting Invite</h2>
            <p className="text-gray-400">Please wait...</p>
          </>
        ) : status === 'error' ? (
          <>
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Invalid Invite</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Invite Accepted!</h2>
            <p className="text-gray-400 mb-6">Redirecting to the session...</p>
            <Button onClick={() => navigate(`/session/${sessionId}`)}>Go to Session</Button>
          </>
        )}
      </div>
    </div>
  );
};
