import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { Button } from '../common/Button';

export interface NewSessionFormProps {
  onClose: () => void;
}

export const NewSessionForm: React.FC<NewSessionFormProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState<'manual' | 'github'>('manual');
  const [githubUrl, setGithubUrl] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [githubStatus, setGithubStatus] = useState<{ connected: boolean; username: string | null } | null>(null);
  const [prInfo, setPrInfo] = useState<{ title: string; fileCount: number; author: string } | null>(null);
  const [validatingPR, setValidatingPR] = useState(false);

  // Check GitHub connection status on mount
  useEffect(() => {
    Meteor.call('github.checkConnection', (err: any, result: any) => {
      if (!err && result) {
        setGithubStatus(result);
      }
    });
  }, []);

  // Validate PR URL when it changes (debounced)
  useEffect(() => {
    if (sourceType !== 'github' || !githubUrl) {
      setPrInfo(null);
      return;
    }

    const timer = setTimeout(() => {
      setValidatingPR(true);
      setPrInfo(null);
      setError('');

      Meteor.call('github.validatePRUrl', githubUrl, (err: any, result: any) => {
        setValidatingPR(false);
        if (err) {
          setError(err.reason || err.message);
        } else if (result) {
          setPrInfo({
            title: result.title,
            fileCount: result.fileCount,
            author: result.author
          });
        }
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [githubUrl, sourceType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // If GitHub source with a URL, use the GitHub import method
    if (sourceType === 'github' && githubUrl) {
      Meteor.call(
        'github.importPR',
        githubUrl,
        { isPublic },
        (err: any, sessionId: string) => {
          setLoading(false);
          if (err) {
            setError(err.reason || err.message);
          } else {
            onClose();
            navigate(`/session/${sessionId}`);
          }
        }
      );
    } else {
      // Manual session creation
      Meteor.call(
        'sessions.create',
        {
          title: title || 'Untitled Session',
          description,
          source: {
            type: sourceType,
            url: sourceType === 'github' ? githubUrl : undefined
          },
          isPublic
        },
        (err: any, sessionId: string) => {
          setLoading(false);
          if (err) {
            setError(err.reason || err.message);
          } else {
            onClose();
            navigate(`/session/${sessionId}`);
          }
        }
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Session Title
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Feature X Code Review"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="What are you reviewing?"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Source
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSourceType('manual')}
            className={`p-4 border rounded-lg text-left transition-colors ${
              sourceType === 'manual'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <div className="font-medium text-gray-900 dark:text-white">Upload Files</div>
            <div className="text-sm text-gray-500">Drag and drop or paste code</div>
          </button>

          <button
            type="button"
            onClick={() => setSourceType('github')}
            className={`p-4 border rounded-lg text-left transition-colors ${
              sourceType === 'github'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub PR
            </div>
            <div className="text-sm text-gray-500">Import from pull request</div>
          </button>
        </div>
      </div>

      {sourceType === 'github' && (
        <div className="space-y-4">
          {/* GitHub Connection Status */}
          {githubStatus && !githubStatus.connected && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm font-medium">GitHub not connected</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    (Meteor as any).loginWithGithub(
                      { requestPermissions: ['user:email', 'repo'] },
                      (err: any) => {
                        if (!err) {
                          // Refresh connection status
                          Meteor.call('github.checkConnection', (e: any, result: any) => {
                            if (!e) setGithubStatus(result);
                          });
                        }
                      }
                    );
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  Connect GitHub
                </button>
              </div>
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                Connect your GitHub account to import pull requests.
              </p>
            </div>
          )}

          {githubStatus?.connected && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Connected as <span className="font-medium">@{githubStatus.username}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pull Request URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={githubUrl}
                onChange={e => setGithubUrl(e.target.value)}
                placeholder="https://github.com/owner/repo/pull/123"
                disabled={!githubStatus?.connected}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {validatingPR && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="w-5 h-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Supports: github.com/owner/repo/pull/123 or owner/repo#123
            </p>
          </div>

          {/* PR Preview */}
          {prInfo && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {prInfo.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    by @{prInfo.author} • {prInfo.fileCount} files changed
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublic"
          checked={isPublic}
          onChange={e => setIsPublic(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded"
        />
        <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
          Make this session public
        </label>
      </div>

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="secondary" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Create Session
        </Button>
      </div>
    </form>
  );
};
