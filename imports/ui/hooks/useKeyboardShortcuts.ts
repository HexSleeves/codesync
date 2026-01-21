import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in an input
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      (e.target as HTMLElement).isContentEditable
    ) {
      // Allow Escape to work even in inputs
      if (e.key !== 'Escape') return;
    }

    for (const shortcut of shortcuts) {
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrl === (e.ctrlKey || e.metaKey);
      const shiftMatch = !!shortcut.shift === e.shiftKey;
      const altMatch = !!shortcut.alt === e.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        e.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export const DEFAULT_SHORTCUTS = {
  SEARCH_FILES: { key: '/', description: 'Search files' },
  NEXT_FILE: { key: 'j', description: 'Next file' },
  PREV_FILE: { key: 'k', description: 'Previous file' },
  TOGGLE_DIFF_MODE: { key: 'd', description: 'Toggle diff mode' },
  MARK_REVIEWED: { key: 'r', description: 'Mark file as reviewed' },
  TOGGLE_SIDEBAR: { key: 'b', description: 'Toggle sidebar' },
  SHOW_HELP: { key: '?', shift: true, description: 'Show keyboard shortcuts' },
  ESCAPE: { key: 'Escape', description: 'Close panel/modal' },
  FOCUS_CHAT: { key: 'c', description: 'Focus chat input' },
  NEXT_COMMENT: { key: 'n', description: 'Next comment' },
  PREV_COMMENT: { key: 'p', description: 'Previous comment' },
};
