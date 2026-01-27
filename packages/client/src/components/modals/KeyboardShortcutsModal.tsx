/**
 * Keyboard shortcuts modal - displays available shortcuts
 */

import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Shortcut[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'General',
    shortcuts: [
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close modal or panel' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['j', '↓'], description: 'Next file' },
      { keys: ['k', '↑'], description: 'Previous file' },
      { keys: ['f'], description: 'Toggle file sidebar' },
      { keys: ['c'], description: 'Toggle chat panel' },
    ],
  },
  {
    title: 'Review',
    shortcuts: [
      { keys: ['d'], description: 'Toggle diff mode (unified/split)' },
      { keys: ['v'], description: 'Toggle view mode (diff/code)' },
      { keys: ['m'], description: 'Mark file as reviewed' },
    ],
  },
];

function KeyboardKey({ children }: { children: string }) {
  return (
    <kbd className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded shadow-sm min-w-[24px] inline-flex items-center justify-center">
      {children}
    </kbd>
  );
}

function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-foreground">{shortcut.description}</span>
      <div className="flex items-center gap-1">
        {shortcut.keys.map((key, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-muted-foreground text-xs mx-0.5">/</span>}
            <KeyboardKey>{key}</KeyboardKey>
          </span>
        ))}
      </div>
    </div>
  );
}

function ShortcutSection({ group }: { group: ShortcutGroup }) {
  return (
    <div className="mb-4 last:mb-0">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {group.title}
      </h3>
      <div className="divide-y divide-border">
        {group.shortcuts.map((shortcut, i) => (
          <ShortcutRow key={i} shortcut={shortcut} />
        ))}
      </div>
    </div>
  );
}

export interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <DialogClose onClick={() => onOpenChange(false)} />

        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
          {shortcutGroups.map((group, i) => (
            <ShortcutSection key={i} group={group} />
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Press <KeyboardKey>?</KeyboardKey> anytime to see this help
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
