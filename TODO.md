# CodeSync Migration TODO

## Current State (Jan 25, 2026)

Migrating from Meteor.js to Hono full-stack SPA. Core functionality complete.

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
- **Local Client**: http://localhost:5173
- **Local API**: http://localhost:8001
- **Public**: https://noon-disk.exe.xyz:5173/

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

## ❌ NOT MIGRATED

### HIGH PRIORITY

_None - all high priority items complete!_

### MEDIUM PRIORITY

2. **Enhanced Chat Features**
   - [x] Load chat history on session open
   - [ ] Typing indicators
   - [ ] Message reactions

3. **Enhanced Cursor Features**
   - [ ] Cursor debouncing/throttling
   - [ ] Smooth cursor animations
   - [ ] Click to follow cursor

### LOW PRIORITY

4. **UI Polish**
   - [ ] Keyboard shortcuts modal (? key)
   - [ ] Share session button/modal
   - [ ] Settings modal
   - [ ] File upload drag & drop
   - [ ] TopBar with review actions (Approve, Request Changes)
   - [x] Toast notifications with sonner (replaces Alert banners)

5. **Testing & Deployment**
   - [ ] E2E tests with Playwright
   - [ ] Unit tests for API routes
   - [ ] Load testing
   - [ ] Data migration scripts (MongoDB → PostgreSQL)
   - [ ] CI/CD setup
   - [ ] Production deployment (Cloudflare Workers or Bun server)
   - [ ] Documentation

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

## NEXT STEPS (Suggested Order)

1. ~~**Load Chat History** - Load previous messages when opening session~~ ✅
2. **UI Polish** - Final touches
   - Keyboard shortcuts
   - Share functionality  
   - Toast notifications
3. **Testing** - Add test coverage
   - E2E tests with Playwright
   - Unit tests for WebSocket handlers

---

## RECENTLY COMPLETED (Jan 26, 2026)

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
