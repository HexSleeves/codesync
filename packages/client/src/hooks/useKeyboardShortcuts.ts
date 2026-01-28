/**
 * Global keyboard shortcut handler for session page
 * Handles navigation, toggles, and modal shortcuts
 */

import { useEffect, useRef, useState } from 'hono/jsx';

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
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Use refs to avoid recreating the event handler when callbacks change
  const optionsRef = useRef<KeyboardShortcutOptions>(options);
  optionsRef.current = options;

  const modalRef = useRef(showShortcutsModal);
  modalRef.current = showShortcutsModal;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const opts = optionsRef.current;
      if (!opts) return;

      const {
        enabled = true,
        onNextFile,
        onPrevFile,
        onToggleFileTree,
        onToggleChat,
        onToggleDiffMode,
        onToggleViewMode,
        onMarkReviewed,
      } = opts;

      if (!enabled) return;

      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
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
          if (modalRef.current) {
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
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty deps - handler is stable, reads from refs

  return {
    showShortcutsModal,
    setShowShortcutsModal,
  };
}
