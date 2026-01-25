# CodeSync Migration TODO

## Current State (Jan 25, 2026)

Migrating from Meteor.js to Hono full-stack SPA. Core functionality working.

### Running the App

```bash
# Start PostgreSQL
cd /home/exedev/codesync && docker compose up -d postgres

# Start API (port 8001)
export PATH="$HOME/.bun/bin:$PATH"
cd packages/api && PORT=8001 bun run dev

# Start Frontend (port 5173+, proxies to API)
cd packages/client && bun run dev
```

### Tech Stack (New)
- **Runtime**: Bun 1.3.6
- **Backend**: Hono 4.11.5 + Drizzle ORM 0.45.1 + PostgreSQL 16
- **Frontend**: Hono JSX-DOM + Vite 7.3.1 + Tailwind CSS 3
- **Validation**: Zod 4.3.6 (uses `z.email()` syntax, NOT `z.string().email()`)
- **Auth**: JWT tokens stored in localStorage

### Project Structure
```
codesync/
├── packages/
│   ├── api/           # Hono backend (port 8001)
│   │   └── src/
│   │       ├── routes/    # auth, sessions, files, comments, chat
│   │       ├── middleware/auth.ts
│   │       ├── db/schema.ts
│   │       └── ws/cursors.ts
│   ├── client/        # Hono JSX-DOM frontend
│   │   └── src/
│   │       ├── pages/     # Home, Login, Dashboard, Session
│   │       ├── hooks/     # useAuth, useSession, useComments
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
- [x] Routes: auth, sessions, files, comments, chat
- [x] Zod validation with @hono/zod-validator

### Frontend (packages/client)
- [x] Hono JSX-DOM setup with Vite
- [x] Client-side routing (useRouter, navigate, Link)
- [x] Global auth store (singleton pattern)
- [x] Pages: Home, Login, Dashboard, Session
- [x] Login/Register with auto-redirect
- [x] Session list and creation
- [x] File tree sidebar
- [x] Basic code viewer with line numbers
- [x] Inline comments on lines
- [x] Mark file as reviewed

### Auth Flow
- [x] Login → stores JWT in localStorage → redirects to /dashboard
- [x] Logout → clears token → redirects to /login
- [x] Auth state shared via singleton store (not per-component)

---

## ❌ NOT MIGRATED

### Backend
1. **GitHub Integration** (HIGH PRIORITY)
   - [ ] `/api/github/import` - Import PR files
   - [ ] `/api/github/validate` - Validate PR URL
   - [ ] GitHub OAuth flow
   - Reference: `imports/api/github/methods.ts`

2. **WebSocket Real-time** (MEDIUM PRIORITY)
   - [ ] Cursor broadcasting to session participants
   - [ ] Chat real-time updates
   - [ ] User presence (online/offline)
   - Handler exists at `packages/api/src/ws/cursors.ts` but no broadcast logic

### Frontend
1. **Diff Viewer** (HIGH PRIORITY)
   - [ ] Unified diff view
   - [ ] Split diff view
   - [ ] Syntax highlighting with Prism.js
   - Reference: `imports/ui/components/Diff/`

2. **Chat Panel** (MEDIUM PRIORITY)
   - [ ] Chat sidebar UI
   - [ ] Real-time message updates
   - Reference: `imports/ui/components/Sidebar/ChatPanel.tsx`

3. **User Presence** (MEDIUM PRIORITY)
   - [ ] Online users list
   - [ ] Cursor positions on code
   - Reference: `imports/ui/components/Sidebar/UserList.tsx`, `imports/ui/components/CodeEditor/Cursors.tsx`

4. **Other UI Components** (LOW PRIORITY)
   - [ ] Keyboard shortcuts modal
   - [ ] Share button
   - [ ] Settings modal
   - [ ] File upload drag & drop
   - [ ] TopBar with review actions

---

## KNOWN ISSUES

1. **Memory**: Heavy processes (SonarLint, tsserver) consume RAM. Kill if needed:
   ```bash
   pkill -f "sonarlint" && pkill -f "tsserver"
   ```

2. **Ports**: Vite may use 5173, 5174, or 5175 depending on what's available. Check terminal output.

3. **Zod v4 Syntax**: Use `z.email()` NOT `z.string().email()`

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
- `imports/ui/components/Diff/UnifiedDiff.tsx` - Unified diff
- `imports/ui/components/Diff/SplitDiff.tsx` - Split diff
- `imports/ui/components/Sidebar/ChatPanel.tsx` - Chat UI
- `imports/ui/components/CodeEditor/Cursors.tsx` - Cursor rendering

### New Hono Code
- `packages/api/src/app.ts` - Main Hono app with routes
- `packages/api/src/middleware/auth.ts` - JWT auth
- `packages/api/src/db/schema.ts` - Drizzle schema
- `packages/client/src/stores/auth.ts` - Auth state management
- `packages/client/src/hooks/useAuth.ts` - Auth hook
- `packages/client/src/pages/Session.tsx` - Code review UI

---

## NEXT STEPS (Suggested Order)

1. **GitHub PR Import** - Most valuable feature
   - Create `packages/api/src/routes/github.ts`
   - Port logic from `imports/api/github/methods.ts`
   - Add to `packages/api/src/app.ts`

2. **Diff Viewer** - Essential for code review
   - Create `packages/client/src/components/DiffViewer.tsx`
   - Port from `imports/ui/components/Diff/`

3. **WebSocket Real-time** - Collaboration feature
   - Implement broadcast in `packages/api/src/ws/cursors.ts`
   - Add `useWebSocket` hook in client
   - Show other users' cursors

4. **Chat Panel** - Nice to have
   - Add chat UI to Session page
   - Connect to WebSocket for real-time
