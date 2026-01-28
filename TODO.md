# CodeSync Migration TODO

## Current State (Jan 28, 2026)

**Migration from Meteor.js to Hono is COMPLETE.** All core features implemented.

### Running the App

```bash
# Start PostgreSQL
cd /home/exedev/codesync && docker compose up -d postgres

# Start API (port 8001)
export PATH="$HOME/.bun/bin:$PATH"
cd packages/api && nohup bun --hot src/index.ts > /tmp/api.log 2>&1 &

# Start Frontend (port 5173)
cd packages/client && nohup bun run dev > /tmp/client.log 2>&1 &

# Or run both together (may exit if backgrounded)
bun run dev
```

### Access URLs

- **Local Client**: <http://localhost:5173>
- **Local API**: <http://localhost:8001>
- **Public**: <https://noon-disk.exe.xyz:5173/>

### Tech Stack

- **Runtime**: Bun 1.3.6
- **Backend**: Hono 4.11.5 + Drizzle ORM 0.45.1 + PostgreSQL 16
- **Frontend**: Hono JSX-DOM + Vite 7.3.1 + Tailwind CSS 4
- **UI Components**: shadcn/ui (new-york style, dark theme)
- **Validation**: Zod 4.3.6 (uses `z.email()` syntax, NOT `z.string().email()`)
- **Auth**: JWT tokens stored in localStorage

### Project Structure

```
codesync/
├── packages/
│   ├── api/           # Hono backend (port 8001)
│   │   └── src/
│   │       ├── config.ts      # Centralized env config
│   │       ├── routes/        # auth, sessions, files, comments, chat
│   │       │   └── github/    # oauth.ts, import.ts (split by domain)
│   │       ├── services/      # Business logic layer
│   │       │   ├── github/    # pr-fetcher.ts, file-processor.ts
│   │       │   └── session/   # access.ts (ownership checks)
│   │       ├── middleware/auth.ts
│   │       ├── db/schema.ts
│   │       ├── utils/         # github-parser.ts, language.ts
│   │       └── ws/index.ts    # WebSocket handlers
│   ├── client/        # Hono JSX-DOM frontend
│   │   └── src/
│   │       ├── pages/     # Home, Login, Dashboard, Session
│   │       ├── components/
│   │       │   ├── ui/    # shadcn components
│   │       │   └── Diff/  # DiffViewer, UnifiedDiff, SplitDiff
│   │       ├── hooks/     # useAuth, useSession, useComments, useGitHub
│   │       ├── stores/auth.ts  # Global auth state singleton
│   │       └── api/client.ts   # API client with JWT
│   └── shared/        # Shared Zod schemas & types
├── imports/           # OLD Meteor code (reference only)
└── docker-compose.yml # PostgreSQL + Redis
```

---

## ✅ COMPLETED

### Backend (packages/api)

- [x] Hono server with hot reload
- [x] PostgreSQL + Drizzle ORM schema (users, sessions, files, comments, chat_messages, session_participants)
- [x] JWT authentication middleware
- [x] Routes: auth, sessions, files, comments, chat, github
- [x] Zod validation with @hono/zod-validator
- [x] GitHub OAuth flow (`/api/github/authorize`, `/api/github/callback`)
- [x] GitHub PR import (`/api/github/import`, `/api/github/validate`)
- [x] GitHub status/disconnect endpoints
- [x] **Domain-based code organization** (Jan 25)
  - Split monolithic github.ts (658 lines) into domain modules
  - Created services layer (github/, session/)
  - Centralized config.ts for environment variables
  - Extracted reusable utilities (language detection, etc.)

### Frontend (packages/client)

- [x] Hono JSX-DOM setup with Vite
- [x] Client-side routing (useRouter, navigate, Link)
- [x] Global auth store (singleton pattern)
- [x] Pages: Home, Login, Dashboard, Session
- [x] Login/Register with auto-redirect
- [x] Session list and creation
- [x] File tree sidebar
- [x] Diff viewer (unified + split modes)
- [x] Inline comments on lines
- [x] Mark file as reviewed
- [x] GitHub OAuth connection UI
- [x] Import PR modal with validation
- [x] **Syntax highlighting** with Prism.js (Jan 25)
  - Language detection from file extension
  - 25+ languages supported
  - One Dark theme
- [x] **WebSocket real-time collaboration** (Jan 25)
  - User presence (online users list)
  - Real-time chat with message persistence
  - Cursor position broadcasting
  - JWT-authenticated WebSocket connections
  - Auto-reconnect with exponential backoff

### UI Components (packages/client/src/components/ui/)

- [x] Alert, AlertDescription, AlertTitle
- [x] Avatar, AvatarImage, AvatarFallback
- [x] Badge (with variants: default, secondary, destructive, success, warning)
- [x] Button (with variants: default, secondary, ghost, link, destructive, outline)
- [x] Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- [x] Checkbox
- [x] Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose
- [x] Input
- [x] Label
- [x] Select, SelectOption
- [x] Separator
- [x] Spinner (sizes: sm, md, lg)
- [x] Textarea

### Styling

- [x] Tailwind CSS 4 with shadcn theme variables
- [x] Dark theme by default (class="dark" on html)
- [x] CSS variables for colors (--background, --foreground, --primary, etc.)
- [x] All pages use semantic theme colors (bg-background, text-foreground, text-muted-foreground, etc.)
- [x] Diff components use theme variables

---

## 🎯 NEXT FEATURES (Pick One)

### Polish & UX

1. **Light Theme Support**
   - Settings modal has theme toggle but light theme needs testing/polish
   - Verify all components look good in light mode
   - System theme detection already implemented

2. **File Upload Drag & Drop**
   - Allow dragging files into session to add them
   - Support for code files, images, etc.
   - Progress indicator for uploads

3. **Enhanced Cursors**
   - [ ] Cursor debouncing/throttling (reduce WebSocket traffic)
   - [ ] Smooth cursor animations (CSS transitions)
   - [ ] Click to follow/jump to another user's cursor

4. **Enhanced Chat**
   - [ ] Typing indicators ("User is typing...")
   - [ ] Message reactions (emoji)
   - [ ] @mentions with autocomplete

### New Features

1. **Comment Threads**
   - Reply to comments (threaded discussions)
   - Collapse/expand threads
   - Thread resolution

2. **Multi-File Selection**
   - Batch mark files as reviewed
   - File filtering/search
   - File grouping by directory

3. **Review Templates**
   - Save comment templates ("LGTM", "Needs tests", etc.)
   - Quick-insert common phrases

4. **Activity Feed**
   - Show recent activity on session (who commented, reviewed, etc.)
   - Notifications for mentions

### Infrastructure

1. **Testing**
   - [ ] E2E tests with Playwright
   - [ ] Unit tests for API routes
   - [ ] WebSocket handler tests
   - [ ] Load testing

2. **Production Deployment**
    - [ ] Systemd service files
    - [ ] Environment configuration
    - [ ] Database backups
    - [ ] SSL/TLS setup
    - [ ] Monitoring/logging

3. **CI/CD**
    - [ ] GitHub Actions workflow
    - [ ] Auto-deploy on push
    - [ ] Type checking in CI
    - [ ] Lint checking in CI

---

## 🧹 CLEANUP TASKS

1. **Remove Old Meteor Code**
   - `imports/` directory contains legacy Meteor code
   - Can be deleted once migration is verified complete
   - ~50+ files, ~10k lines of code

2. **Type Safety Improvements**
   - Add stricter TypeScript settings
   - Fix any remaining `any` types
   - Add return types to all functions

3. **Code Organization**
   - Move shared utilities to `packages/shared`
   - Consolidate duplicate code
   - Add JSDoc comments to public APIs

4. **Performance**
   - Audit bundle size
   - Lazy load heavy components (Prism.js, etc.)
   - Optimize WebSocket message frequency

5. **Accessibility**
   - Add ARIA labels
   - Keyboard navigation improvements
   - Screen reader testing

---

## KNOWN ISSUES

1. **Disk Space**: VM can fill up. Clear caches:

   ```bash
   rm -rf ~/.cache/* ~/.bun/install/cache/*
   ```

2. **Port Conflicts**: Kill existing processes:

   ```bash
   fuser -k 8001/tcp 5173/tcp
   ```

3. **Zod v4 Syntax**: Use `z.email()` NOT `z.string().email()`

4. **Background Processes**: `bun run dev` exits when backgrounded. Use nohup or run in separate terminals.

---

## TEST ACCOUNTS

```
Email: test2@example.com
Password: password123
```

---

## REFERENCE FILES

### Old Meteor Code (for reference when migrating)

- `imports/api/github/methods.ts` - GitHub PR import logic
- `imports/api/github/parser.ts` - PR URL parsing
- `imports/api/github/fetcher.ts` - GitHub API calls
- `imports/ui/components/Diff/DiffViewer.tsx` - Diff rendering
- `imports/ui/components/Sidebar/ChatPanel.tsx` - Chat UI
- `imports/ui/components/Sidebar/UserList.tsx` - User presence
- `imports/ui/components/CodeEditor/Cursors.tsx` - Cursor rendering

### New Hono Code

- `packages/api/src/app.ts` - Main Hono app with routes
- `packages/api/src/config.ts` - Centralized environment config
- `packages/api/src/middleware/auth.ts` - JWT auth
- `packages/api/src/db/schema.ts` - Drizzle schema
- `packages/api/src/routes/github/` - GitHub OAuth + import (split by domain)
- `packages/api/src/services/` - Business logic layer
- `packages/api/src/ws/index.ts` - WebSocket handlers (cursors, chat, presence)
- `packages/client/src/hooks/useWebSocket.ts` - WebSocket connection hook
- `packages/client/src/components/session/ChatPanel.tsx` - Real-time chat
- `packages/client/src/components/session/OnlineUsers.tsx` - Online user display
- `packages/client/src/stores/auth.ts` - Auth state management
- `packages/client/src/hooks/useAuth.ts` - Auth hook
- `packages/client/src/hooks/useGitHub.ts` - GitHub connection hook
- `packages/client/src/pages/Session.tsx` - Code review UI
- `packages/client/src/components/Diff/` - Diff viewer components
- `packages/client/src/components/ui/` - shadcn UI components

---

## ✅ MIGRATION COMPLETE

All planned features from the Meteor → Hono migration are now implemented:

- [x] Authentication (JWT)
- [x] Session CRUD
- [x] File management
- [x] Diff viewer (unified + split)
- [x] Syntax highlighting
- [x] Inline comments
- [x] Real-time collaboration (WebSocket)
- [x] User presence
- [x] Real-time chat
- [x] Cursor broadcasting
- [x] GitHub OAuth
- [x] GitHub PR import
- [x] GitHub review sync (push reviews to PRs)
- [x] Review workflow (draft → in_review → approved → merged)
- [x] Keyboard shortcuts
- [x] Share sessions
- [x] User settings
- [x] Toast notifications
- [x] Mobile responsive design

---

## RECENTLY COMPLETED (Jan 28, 2026)

- **Comment Mutation Fix** (Jan 28)
  - Fixed closure issue in useComments hook
  - Pass fileId as mutation argument instead of capturing from closure

- **GitHub Review Sync** (Jan 28) - Plan 003
  - Submit CodeSync reviews to GitHub PRs with one click
  - New API endpoints: POST /github/sessions/:id/submit-review, GET /github/sessions/:id/sync-status
  - Diff line mapping to GitHub positions
  - Session approval status maps to GitHub APPROVE action
  - Comment sync tracking (prevents duplicate posts)
  - SubmitReviewButton with confirmation dialog
  - GitHub icon indicator on synced comments

- **Review Workflow** (Jan 27)
  - Session status transitions: draft → in_review → approved → merged
  - ReviewActions component with context-specific buttons
  - Tracks who/when for each status change (reviewStartedBy, approvedBy, mergedBy)
  - Database migration for new columns

- **UI Polish Modals** (Jan 26) - Implemented by 3 parallel agents
  - Keyboard Shortcuts Modal: Press `?` to show shortcuts, `j/k` for file nav, `f/c/d/v/m` for toggles
  - Share Session: Generate/copy/revoke share links, public read-only SharedSession page
  - Settings Modal: Theme, font size, default diff/view modes, localStorage persistence

- **Custom Form Hook** - Replaced react-hook-form with custom `useForm` hook
  - TanStack React Form incompatible with Hono JSX (uses React hooks)
  - Created `lib/form.tsx` with simple getFieldProps API
  - Converted: LoginPage, NewSessionDialog, ImportPRDialog, CommentForm, ChatPanel
  - Added onBlur/onFocus props to Input, Textarea components
  - Removed react-hook-form and @hookform/resolvers dependencies
  - Bundle size reduced by ~44KB

- **Toast Notifications** - Replaced inline Alert banners with sonner toast system
  - Uses React createRoot to mount sonner (since it's a React component)
  - Auto-initializes on first toast() call
  - Rich colors for success/error/warning variants
  - Top-right positioning with close button
  - Updated: Dashboard, Login, ImportPRDialog
