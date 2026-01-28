# Plan 002: UI Polish - Keyboard Shortcuts, Share Session, Settings Modal

**Status**: 🟢 Complete  
**Created**: Jan 26, 2026  
**Completed**: Jan 26, 2026  
**Estimated**: 2-3 hours  

---

## Overview

Implement three UI polish features to enhance user experience:

1. **Keyboard Shortcuts Modal** - Press `?` to show available shortcuts
2. **Share Session Functionality** - Button/modal to share session link  
3. **Settings Modal** - User preferences (diff mode, theme, etc.)

---

## 1. Keyboard Shortcuts Modal

### Requirements
- Press `?` key anywhere to open modal
- Show all available keyboard shortcuts grouped by category
- Close with Escape or clicking outside
- Should work globally (Session page) and ideally site-wide

### Shortcuts to Implement

| Key | Action | Scope |
|-----|--------|-------|
| `?` | Open shortcuts modal | Global |
| `Escape` | Close modal/panel | Global |
| `j` / `k` | Next/previous file | Session |
| `n` / `p` | Next/previous file (alternative) | Session |
| `f` | Toggle file tree sidebar | Session |
| `c` | Toggle chat panel | Session |
| `d` | Toggle diff mode (unified/split) | Session |
| `v` | Toggle view mode (diff/code) | Session |
| `m` | Mark file as reviewed | Session |
| `Enter` | Add comment on selected line | Session |
| `/` | Focus search (future) | Global |

### Implementation

#### Files to Create
```
packages/client/src/
├── components/
│   └── modals/
│       └── KeyboardShortcutsModal.tsx   # Modal component
├── hooks/
│   └── useKeyboardShortcuts.ts          # Global keyboard listener
```

#### KeyboardShortcutsModal.tsx
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';

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
      { keys: ['Enter'], description: 'Add comment on line' },
    ],
  },
];

export function KeyboardShortcutsModal({ open, onOpenChange }) { ... }
```

#### useKeyboardShortcuts.ts
```tsx
// Global keyboard shortcut handler
// Returns { showShortcutsModal, setShowShortcutsModal }
// Plus callbacks for session-specific actions

export function useKeyboardShortcuts(options: {
  onNextFile?: () => void;
  onPrevFile?: () => void;
  onToggleFileTree?: () => void;
  onToggleChat?: () => void;
  onToggleDiffMode?: () => void;
  onToggleViewMode?: () => void;
  onMarkReviewed?: () => void;
  enabled?: boolean;
}) { ... }
```

#### Integration in Session.tsx
```tsx
const [showShortcutsModal, setShowShortcutsModal] = useState(false);

useKeyboardShortcuts({
  onNextFile: () => selectNextFile(),
  onPrevFile: () => selectPrevFile(),
  onToggleFileTree: () => setShowFileTree(!showFileTree),
  onToggleChat: () => setShowChat(!showChat),
  // ...
});

// Add in JSX
<KeyboardShortcutsModal open={showShortcutsModal} onOpenChange={setShowShortcutsModal} />
```

---

## 2. Share Session Functionality

### Requirements
- Button in session header to open share modal
- Generate shareable link (uses existing `shareToken` in schema)
- Copy link to clipboard with feedback
- Toggle between public/private session
- Show QR code (optional, nice-to-have)

### Implementation

#### Backend Changes

**packages/api/src/routes/sessions.ts** - Add endpoint:
```typescript
// POST /api/sessions/:id/share - Generate or regenerate share token
.post('/:id/share', authMiddleware, async (c) => {
  const { id } = c.req.param();
  const userId = c.get('userId');
  
  // Verify ownership
  const session = await getSession(id);
  if (session.createdBy !== userId) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  
  // Generate new share token if none exists
  const shareToken = session.shareToken || nanoid(12);
  await db.update(sessions).set({ shareToken }).where(eq(sessions.id, id));
  
  return c.json({ shareToken });
});

// DELETE /api/sessions/:id/share - Revoke share token
.delete('/:id/share', authMiddleware, async (c) => {
  const { id } = c.req.param();
  // ... verify ownership, set shareToken to null
});

// GET /api/sessions/shared/:token - Access shared session (no auth required)
.get('/shared/:token', async (c) => {
  const { token } = c.req.param();
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.shareToken, token),
    with: { files: true }
  });
  
  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }
  
  return c.json({ session });
});
```

#### Frontend Files
```
packages/client/src/
├── components/
│   └── modals/
│       └── ShareSessionModal.tsx
├── pages/
│   └── SharedSession.tsx          # Public view for shared sessions
```

#### ShareSessionModal.tsx
```tsx
export function ShareSessionModal({ 
  open, 
  onOpenChange, 
  sessionId,
  shareToken,
  isPublic 
}) {
  const shareUrl = shareToken 
    ? `${window.location.origin}/shared/${shareToken}` 
    : null;
  
  // Generate share link button
  // Copy to clipboard button
  // Revoke link button
  // Toggle public/private
}
```

#### Session Header Integration
Add Share button next to session status in `Session.tsx` header:
```tsx
<Button variant="outline" size="sm" onClick={() => setShowShareModal(true)}>
  <ShareIcon className="size-4 mr-1.5" />
  Share
</Button>
```

---

## 3. Settings Modal

### Requirements
- User preferences that persist (localStorage initially, later user profile)
- Accessible from user dropdown menu
- Settings categories:
  - **Appearance**: Theme (dark/light/system), Font size
  - **Editor**: Default diff mode, Default view mode, Show line numbers
  - **Notifications**: Sound notifications, Desktop notifications

### Implementation

#### Settings Store
```
packages/client/src/stores/settings.ts
```

```typescript
import { createStore } from 'zustand/vanilla';

interface Settings {
  // Appearance
  theme: 'dark' | 'light' | 'system';
  fontSize: 'sm' | 'md' | 'lg';
  
  // Editor
  defaultDiffMode: 'unified' | 'split';
  defaultViewMode: 'diff' | 'code';
  showLineNumbers: boolean;
  
  // Notifications
  soundEnabled: boolean;
  desktopNotifications: boolean;
}

const defaultSettings: Settings = {
  theme: 'dark',
  fontSize: 'md',
  defaultDiffMode: 'unified',
  defaultViewMode: 'diff',
  showLineNumbers: true,
  soundEnabled: true,
  desktopNotifications: false,
};

// Load from localStorage
function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem('codesync-settings');
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export const settingsStore = createStore<Settings & SettingsActions>()((set, get) => ({
  ...loadSettings(),
  
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => {
    set({ [key]: value });
    localStorage.setItem('codesync-settings', JSON.stringify(get()));
  },
  
  resetSettings: () => {
    set(defaultSettings);
    localStorage.removeItem('codesync-settings');
  },
}));
```

#### SettingsModal.tsx
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
import { Label, Select, Checkbox } from '@/components/ui';

export function SettingsModal({ open, onOpenChange }) {
  // Tabs or sections for different setting categories
  // Form controls for each setting
}
```

#### Integration Points

1. **UserDropdown.tsx** - Add "Settings" menu item
2. **Session.tsx** - Use settings for default diff/view modes
3. **App.tsx** - Apply theme setting to document

---

## File Changes Summary

### New Files
| File | Purpose |
|------|--------|
| `components/modals/KeyboardShortcutsModal.tsx` | Shortcuts help modal |
| `components/modals/ShareSessionModal.tsx` | Share link generation |
| `components/modals/SettingsModal.tsx` | User preferences |
| `components/modals/index.ts` | Barrel export |
| `hooks/useKeyboardShortcuts.ts` | Global keyboard handler |
| `stores/settings.ts` | Settings persistence |
| `pages/SharedSession.tsx` | Public shared view |

### Modified Files
| File | Changes |
|------|--------|
| `pages/Session.tsx` | Add keyboard shortcuts, share button, modals |
| `components/layout/UserDropdown.tsx` | Add Settings menu item |
| `components/icons/index.tsx` | Add ShareIcon, KeyboardIcon |
| `api/routes/sessions.ts` | Add share endpoints |
| `router.tsx` | Add /shared/:token route |

---

## Implementation Order

### Phase 1: Keyboard Shortcuts (45 min)
1. Create `useKeyboardShortcuts` hook
2. Create `KeyboardShortcutsModal` component
3. Integrate into Session.tsx
4. Add file navigation shortcuts (j/k)
5. Test all shortcuts

### Phase 2: Share Session (60 min)
1. Add backend share endpoints
2. Create `ShareSessionModal` component
3. Add ShareIcon and Share button
4. Create SharedSession page for public access
5. Add route for /shared/:token
6. Test sharing flow

### Phase 3: Settings Modal (45 min)
1. Create settings store
2. Create `SettingsModal` component
3. Add to UserDropdown
4. Apply settings (theme, defaults)
5. Test persistence

---

## Testing Checklist

### Keyboard Shortcuts
- [ ] `?` opens modal from session page
- [ ] `Escape` closes modal
- [ ] `j`/`k` navigates files
- [ ] `f` toggles file sidebar
- [ ] `c` toggles chat
- [ ] `d` toggles diff mode
- [ ] `m` marks file reviewed
- [ ] Shortcuts disabled when typing in input/textarea

### Share Session
- [ ] Share button visible in session header
- [ ] Generate link creates token
- [ ] Copy button copies URL
- [ ] Shared link works without login
- [ ] Revoke link invalidates token

### Settings
- [ ] Settings accessible from user menu
- [ ] Settings persist on refresh
- [ ] Theme switch works
- [ ] Default diff mode applies
- [ ] Reset to defaults works

---

## Notes

- All modals use existing Dialog component from shadcn/ui
- Follow existing patterns in codebase (zustand stores, Hono JSX)
- Settings stored in localStorage for MVP, can move to user profile later
- Shared sessions are read-only for non-authenticated users
