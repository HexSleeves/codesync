import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from '../../../api/sessions/collection';
import type { MeteorError, SessionInviteResult } from '../../../types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';

interface ShareButtonProps {
  session: Session;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ session }) => {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const { showToast } = useToast();
  
  const shareUrl = `${window.location.origin}/session/${session._id}`;
  const tokenUrl = session.shareToken 
    ? `${window.location.origin}/join/${session.shareToken}`
    : null;
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    
    setInviteLoading(true);
    Meteor.call('sessions.inviteByEmail', session._id, inviteEmail.trim(), (err: MeteorError | null, result?: SessionInviteResult) => {
      setInviteLoading(false);
      if (err) {
        showToast(err.reason || 'Failed to send invite', 'error');
      } else if (!result) {
        showToast('Unknown error', 'error');
      } else if (result.status === 'added') {
        showToast('User added to session!', 'success');
        setInviteEmail('');
      } else if (result.status === 'already_invited') {
        showToast('User has already been invited', 'info');
      } else {
        showToast('Invite sent! Share this link with them:', 'success');
        copyToClipboard(result.inviteUrl ?? '');
        setInviteEmail('');
      }
    });
  };
  
  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowModal(true)}
      >
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share
      </Button>
      
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Share Session"
        size="md"
      >
        <div className="space-y-6">
          {/* Invite by email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Invite by Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                placeholder="colleague@example.com"
                className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400"
              />
              <Button
                onClick={handleInvite}
                loading={inviteLoading}
                disabled={!inviteEmail.trim()}
              >
                Invite
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              If they have an account, they'll be added instantly. Otherwise, they'll get an invite link.
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Direct link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Session URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
              <Button
                variant="secondary"
                onClick={() => copyToClipboard(shareUrl)}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {session.isPublic 
                ? 'Anyone with this link can view the session'
                : 'Only invited users can access this session'
              }
            </p>
          </div>
          
          {/* Invite link */}
          {tokenUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quick Invite Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tokenUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
                <Button
                  variant="secondary"
                  onClick={() => copyToClipboard(tokenUrl)}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Anyone with this link will be added as a participant when they sign in
              </p>
            </div>
          )}
          
          {/* Visibility status */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <svg className={`w-5 h-5 ${session.isPublic ? 'text-green-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {session.isPublic ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              )}
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {session.isPublic ? 'Public session' : 'Private session'}
              </p>
              <p className="text-xs text-gray-500">
                {session.isPublic 
                  ? 'Visible to everyone' 
                  : `${session.allowedUsers.length} invited participants`
                }
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
