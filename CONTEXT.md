# Agent Context Dump

**Last Updated:** Feb 8, 2026
**Last Task:** Full codebase review + 58 fixes across 4 phases

---

## Current Project State

CodeSync is a real-time collaborative code review application. The migration from Meteor.js to Hono is nearly complete.

### Running Services

```bash
# Start PostgreSQL
cd /home/exedev/codesync && docker compose up -d postgres

# Start API (port 8001)
export PATH="$HOME/.bun/bin:$PATH"
cd packages/api && nohup bun --hot src/index.ts > /tmp/api.log 2>&1 &

# Start Client (port 5173)
cd packages/client && nohup bun run dev > /tmp/client.log 2>&1 &
```

### Live URLs

- **Frontend**: <https://noon-disk.exe.xyz:5173/>
- **API**: <https://noon-disk.exe.xyz:8001/>
- **Health Check**: <https://noon-disk.exe.xyz:8001/health>

### Test Account

```
Email: test2@example.com
Password: password123
```

---

## Recent Changes (Feb 8, 2026)

### Full Codebase Review & 58+ Fixes (4 Phases)

**Phase 1: Security Hardening**
- Switched password hashing from SHA-256 to argon2id (`Bun.password.hash()`)
- JWT_SECRET validated on startup in production; random dev default
- Added authorization checks to ALL file/comment/chat routes (IDOR fixes)
- Signed OAuth state with HMAC (prevents user impersonation)
- Added session access check to WebSocket upgrade handler
- Fixed cookie `path: '/'` on set and delete
- Configured DB connection pool (max:20, idle_timeout:30)
- Added graceful shutdown handler (SIGTERM/SIGINT)

**Phase 2: API Bug Fixes**
- Fixed broken comment sync (blanket UPDATE marked ALL comments synced)
- Fixed N+1 queries in status update (batch user lookup)
- Fixed session listing (owned+participated, not all public)
- Fixed WebSocket multi-tab support (connectionId instead of userId)
- Added 9 DB indexes + unique constraint on sessionParticipants
- Removed dead code (4 unused exported functions)
- Parallelized PR file processing (batch of 5 concurrent)
- Removed unused Redis from docker-compose

**Phase 3: Client Cleanup**
- Removed 36 unused dependencies (26 @radix-ui, lucide-react, etc.)
- Deleted 6 dead components (CursorOverlay, PageHeader, UserMenu, etc.)
- Extracted shared store boilerplate to `lib/store.ts` (~100 lines removed)
- Replaced 11 `any` types with proper types
- Fixed useQuery/useMutation option tracking
- Capped WebSocket chat at 500 messages
- Fixed auth store init retry, settings memory leak

**Phase 4: Infrastructure**
- Generated & applied migration 0003 (indexes + unique constraint)
- Fixed all lint warnings to 0

---

## Previous Changes (Jan 26, 2026)

### 1. Custom Form Hook Implementation

- Created custom `useForm` hook in `lib/form.tsx` for Hono JSX compatibility
- TanStack React Form was incompatible (uses React hooks internally)
- Simple API with `getFieldProps`, `getTextAreaProps`, `getCheckboxProps`
- Added `onBlur` and `onFocus` props to Input and Textarea components
- Converted all forms:
  - `LoginPage` - login/register form
  - `NewSessionDialog` - create session form
  - `ImportPRDialog` - GitHub PR URL form
  - `CommentForm` - inline/block comment form
  - `ChatPanel` - real-time chat input
- Removed unused `react-hook-form` and `@hookform/resolvers` dependencies
- Bundle size reduced by ~44KB

---

## Previous Changes (Jan 25, 2026)

### 1. Mobile-First Responsive Design

- Updated all client components to use mobile-first approach
- **PageHeader**: Wraps items with gap on mobile
- **UserMenu**: Truncated email, smaller buttons on mobile
- **GitHubStatus**: Shows "GitHub" text on mobile, full text on desktop
- **Dashboard**: Stacked title/buttons on mobile, full-width action buttons
- **Session page**: Collapsible file tree and chat sidebars on mobile
  - File tree hidden by default, toggleable via hamburger menu
  - Chat panel hidden by default, full-width when open on mobile
  - Desktop shows both sidebars permanently
- **SessionCard**: Title truncation, smaller text on mobile
- **FileHeader**: Stacked controls on mobile
- **Home page**: Responsive hero text and feature grid

### 2. API Refactoring (Previous)

- Split monolithic `github.ts` (658 lines) into domain modules:
  - `routes/github/oauth.ts` - OAuth flow
  - `routes/github/import.ts` - PR import
  - `services/github/pr-fetcher.ts` - GitHub API
  - `services/github/file-processor.ts` - File processing
  - `services/session/access.ts` - Access control
- Created `config.ts` for centralized environment variables
- Added `utils/language.ts` for language detection

### 2. WebSocket Real-time (Plan 001 - COMPLETE)

- **Backend**: `packages/api/src/ws/index.ts`
  - JWT-authenticated WebSocket connections
  - Session state management (connections, cursors)
  - Cursor position broadcasting
  - Real-time chat with DB persistence
  - User presence (join/leave)

- **Shared**: `packages/shared/src/ws-types.ts`
  - `CursorMessage`, `PresenceMessage`, `WSChatMessage`
  - `ServerMessage`, `ClientMessage` union types

- **Client**:
  - `hooks/useWebSocket.ts` - WebSocket hook with auto-reconnect
  - `components/session/OnlineUsers.tsx` - Online user avatars
  - `components/session/ChatPanel.tsx` - Real-time chat
  - `components/session/CursorOverlay.tsx` - Cursor display
  - Updated `Session.tsx` with WebSocket integration
  - Updated `DiffViewer`, `UnifiedDiff`, `SplitDiff` for cursors

### 3. Documentation

- Created comprehensive `README.md` with screenshots
- Added `plans/` directory for tracking implementation plans
- Added `LICENSE` (MIT)
- Updated `TODO.md`

---

## Project Structure

```
codesync/
├── packages/
│   ├── api/                 # Hono backend (port 8001)
│   │   └── src/
│   │       ├── config.ts    # Environment config
│   │       ├── index.ts     # Server entry + WS upgrade
│   │       ├── app.ts       # Hono routes
│   │       ├── routes/
│   │       │   ├── auth.ts
│   │       │   ├── sessions.ts
│   │       │   ├── files.ts
│   │       │   ├── comments.ts
│   │       │   ├── chat.ts
│   │       │   └── github/  # OAuth + import
│   │       ├── services/
│   │       │   ├── github/  # PR fetching, file processing
│   │       │   └── session/ # Access control
│   │       ├── middleware/
│   │       │   └── auth.ts  # JWT middleware
│   │       ├── db/
│   │       │   ├── client.ts
│   │       │   └── schema.ts
│   │       ├── ws/
│   │       │   └── index.ts # WebSocket handlers
│   │       └── utils/
│   │           ├── github-parser.ts
│   │           └── language.ts
│   │
│   ├── client/              # Hono JSX-DOM frontend (port 5173)
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── Home.tsx
│   │       │   ├── Login.tsx
│   │       │   ├── Dashboard.tsx
│   │       │   └── Session.tsx
│   │       ├── components/
│   │       │   ├── ui/      # shadcn components
│   │       │   ├── Diff/    # DiffViewer, UnifiedDiff, SplitDiff
│   │       │   ├── session/ # OnlineUsers, ChatPanel, FileTree
│   │       │   └── comment/ # InlineCommentPanel
│   │       ├── hooks/
│   │       │   ├── useAuth.ts
│   │       │   ├── useSession.ts
│   │       │   ├── useComments.ts
│   │       │   ├── useGitHub.ts
│   │       │   └── useWebSocket.ts
│   │       ├── stores/
│   │       │   └── auth.ts
│   │       └── api/
│   │           └── client.ts
│   │
│   └── shared/              # Shared types & schemas
│       └── src/
│           ├── types.ts
│           ├── schemas.ts
│           └── ws-types.ts
│
├── plans/                   # Implementation plans
│   ├── README.md
│   └── 001-websocket-realtime.md (COMPLETE)
│
├── docs/
│   └── screenshots/
│
├── README.md
├── TODO.md
├── CONTEXT.md              # This file
├── AGENTS.md               # Agent instructions
├── LICENSE
└── docker-compose.yml
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Bun 1.3+ |
| Backend | Hono 4.11 |
| Frontend | Hono JSX-DOM |
| Database | PostgreSQL 16 + Drizzle ORM |
| Validation | Zod v4 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth | JWT (HTTP-only cookies) |
| Real-time | Bun WebSocket + custom handlers |
| Syntax Highlighting | Prism.js |
| Form Management | Custom useForm hook |

---

## Key Files to Know

### Backend

- `packages/api/src/index.ts` - Server entry, WebSocket upgrade logic
- `packages/api/src/ws/index.ts` - WebSocket handlers (cursors, chat, presence)
- `packages/api/src/config.ts` - All environment variables
- `packages/api/src/middleware/auth.ts` - JWT authentication
- `packages/api/src/db/schema.ts` - Database schema

### Frontend

- `packages/client/src/pages/Session.tsx` - Main code review UI
- `packages/client/src/hooks/useWebSocket.ts` - WebSocket connection hook
- `packages/client/src/stores/auth.ts` - Auth state management
- `packages/client/src/components/Diff/` - Diff viewer components
- `packages/client/src/lib/form.tsx` - TanStack Form wrapper for Hono JSX

### Shared

- `packages/shared/src/ws-types.ts` - WebSocket message types
- `packages/shared/src/types.ts` - Domain types
- `packages/shared/src/schemas.ts` - Zod validation schemas

---

## Completed Features

- [x] User authentication (login/register/logout)
- [x] Session CRUD
- [x] File management
- [x] Diff viewer (unified + split)
- [x] Syntax highlighting (25+ languages)
- [x] Inline comments
- [x] GitHub OAuth
- [x] GitHub PR import
- [x] WebSocket real-time:
  - [x] User presence
  - [x] Real-time chat
  - [x] Cursor broadcasting

## Remaining Work

- [ ] Load chat history on session open
- [ ] Typing indicators
- [ ] Keyboard shortcuts
- [ ] Share session functionality
- [ ] Toast notifications
- [ ] E2E tests
- [ ] Production deployment

---

## Git Status

```bash
# Recent commits
git log --oneline -10

# Current branch
git branch --show-current  # new
```

## Useful Commands

```bash
# Check server logs
tail -f /tmp/api.log
tail -f /tmp/client.log

# Kill servers
fuser -k 8001/tcp 5173/tcp

# Type check
cd packages/api && bun tsc --noEmit
cd packages/client && bun tsc --noEmit

# Lint
bun run lint

# Database
cd packages/api && bun run db:studio
```
