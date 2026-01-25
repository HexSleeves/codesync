import { useMemo } from 'react';
import { Meteor } from 'meteor/meteor';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import type { File } from '../../api/files/files';

interface UseSessionShortcutsOptions {
  showKeyboardHelp: boolean;
  setShowKeyboardHelp: (show: boolean) => void;
  commentLine: number | null;
  setCommentLine: (line: number | null) => void;
  setDiffMode: (fn: (mode: 'unified' | 'split') => 'unified' | 'split') => void;
  setShowRightSidebar: (fn: (show: boolean) => boolean) => void;
  selectedFileId: string | null;
  files: File[];
}

export function useSessionShortcuts({
  showKeyboardHelp,
  setShowKeyboardHelp,
  commentLine,
  setCommentLine,
  setDiffMode,
  setShowRightSidebar,
  selectedFileId,
  files,
}: UseSessionShortcutsOptions) {
  const shortcuts = useMemo(
    () => [
      {
        key: '?',
        shift: true,
        description: 'Show keyboard shortcuts',
        action: () => setShowKeyboardHelp(true),
      },
      {
        key: 'Escape',
        description: 'Close panel',
        action: () => {
          if (showKeyboardHelp) setShowKeyboardHelp(false);
          else if (commentLine !== null) setCommentLine(null);
        },
      },
      {
        key: 'd',
        description: 'Toggle diff mode',
        action: () => setDiffMode(m => (m === 'unified' ? 'split' : 'unified')),
      },
      {
        key: 'b',
        description: 'Toggle sidebar',
        action: () => setShowRightSidebar(s => !s),
      },
      {
        key: 'r',
        description: 'Mark file as reviewed',
        action: () => {
          if (selectedFileId) {
            const file = files.find(f => f._id === selectedFileId);
            if (file) {
              Meteor.call(
                file.isReviewed ? 'files.unmarkReviewed' : 'files.markReviewed',
                selectedFileId
              );
            }
          }
        },
      },
      {
        key: 'c',
        description: 'Focus chat',
        action: () => {
          const chatInput = document.querySelector<HTMLInputElement>('[data-chat-input]');
          chatInput?.focus();
        },
      },
    ],
    [
      showKeyboardHelp,
      commentLine,
      selectedFileId,
      files,
      setShowKeyboardHelp,
      setCommentLine,
      setDiffMode,
      setShowRightSidebar,
    ]
  );

  useKeyboardShortcuts(shortcuts);
}
