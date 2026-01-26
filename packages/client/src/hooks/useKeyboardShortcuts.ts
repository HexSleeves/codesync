/**
 * Global keyboard shortcut handler for session page
 * Handles navigation, toggles, and modal shortcuts
 */

import { useCallback, useEffect, useState } from 'hono/jsx';

export interface KeyboardShortcutOptions {
  /** Navigate to next file */
  onNextFile?: () => void;
  /** Navigate to previous file */
  onPrevFile?: () => void;
  /** Toggle file tree sidebar */
  onToggleFileTree?: () => void;
  /** Toggle chat panel */
  onToggleChat?: () => void;
  /** Toggle diff mode (unified/split) */
  onToggleDiffMode?: () => void;
  /** Toggle view mode (diff/code) */
  onToggleViewMode?: () => void;
  /** Mark current file as reviewed */
  onMarkReviewed?: () => void;
  /** Enable/disable shortcuts */
  enabled?: boolean;
}

export function useKeyboardShortcuts(options: KeyboardShortcutOptions = {}) {
  const {
    onNextFile,
    onPrevFile,
    onToggleFileTree,
    onToggleChat,
    onToggleDiffMode,
    onToggleViewMode,
    onMarkReviewed,
    enabled = true,
  } = options;

  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Don't handle shortcuts when modifiers are pressed (except for specific combos)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      switch (e.key) {
        case '?':
          e.preventDefault();
          setShowShortcutsModal(true);
          break;

        case 'Escape':
          if (showShortcutsModal) {
            e.preventDefault();
            setShowShortcutsModal(false);
          }
          break;

        case 'j':
        case 'ArrowDown':
          if (!e.shiftKey && onNextFile) {
            e.preventDefault();
            onNextFile();
          }
          break;

        case 'k':
        case 'ArrowUp':
          if (!e.shiftKey && onPrevFile) {
            e.preventDefault();
            onPrevFile();
          }
          break;

        case 'f':
          if (onToggleFileTree) {
            e.preventDefault();
            onToggleFileTree();
          }
          break;

        case 'c':
          if (onToggleChat) {
            e.preventDefault();
            onToggleChat();
          }
          break;

        case 'd':
          if (onToggleDiffMode) {
            e.preventDefault();
            onToggleDiffMode();
          }
          break;

        case 'v':
          if (onToggleViewMode) {
            e.preventDefault();
            onToggleViewMode();
          }
          break;

        case 'm':
          if (onMarkReviewed) {
            e.preventDefault();
            onMarkReviewed();
          }
          break;
      }
    },
    [
      enabled,
      showShortcutsModal,
      onNextFile,
      onPrevFile,
      onToggleFileTree,
      onToggleChat,
      onToggleDiffMode,
      onToggleViewMode,
      onMarkReviewed,
    ]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    showShortcutsModal,
    setShowShortcutsModal,
  };
}
