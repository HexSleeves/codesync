# Agent Context Dump

**Last Updated:** Feb 8, 2026
**Last Task:** Full codebase review (58+ fixes) + started Add Files feature

---

## Current Project State

CodeSync is a real-time collaborative code review app. Meteor→Hono migration is complete. A major security/quality review was done with fixes across 4 phases.

### Running Services

```bash
# Start PostgreSQL
cd /home/exedev/codesync && docker compose up -d postgres

# Start API (port 8001)
export PATH="$HOME/.bun/bin:$PATH"
cd packages/api && bun --hot src/index.ts

# Start Client (port 5173)
cd packages/client && bun run dev
```

### Environment Setup

**IMPORTANT:** `.env` files are NOT in git. They must exist in both locations:
- `/home/exedev/codesync/.env` (root)
- `/home/exedev/codesync/packages/api/.env` (copy of root — Bun loads .env from CWD)

Current `.env` contents:
```
DATABASE_URL=postgres://codesync:codesync@localhost:5432/codesync
JWT_SECRET=codesync-dev-secret-do-not-use-in-production
PORT=8001
NODE_ENV=development
FRONTEND_URL=https://noon-disk.exe.xyz:5173
CORS_ORIGIN=https://noon-disk.exe.xyz:5173
GITHUB_CLIENT_ID=Ov23li8HongvGIUS6cgX
GITHUB_CLIENT_SECRET=95292721c41587f906ece0c4e5ba83a5393b4983
GITHUB_REDIRECT_URI=https://noon-disk.exe.xyz:8001/api/github/callback
```

If the `.env` is missing, the API will use a **random JWT secret** on each restart, invalidating all existing tokens (users see auth errors).

### Live URLs

- **Frontend**: <https://noon-disk.exe.xyz:5173/>
- **API**: <https://noon-disk.exe.xyz:8001/>
- **Health Check**: <https://noon-disk.exe.xyz:8001/health>

### Test Accounts

| Email | Password | Notes |
|-------|----------|-------|
| `test2@example.com` | `password123` | Main test account, GitHub connected (HexSleeves) |
| `review-test@example.com` | `testpass123` | Created during review phase |
| `lecoqjacob@gmail.com` | `password123` | Owner's account |

### Password Hashing Migration

Passwords are now argon2id. Legacy SHA-256 hashes are transparently migrated on login:
- `routes/auth.ts` has `verifyPassword()` that tries argon2id first, falls back to legacy SHA-256
- On successful legacy login, the hash is re-written to argon2id
- Most test accounts have already been migrated (check DB: hash starts with `$argon2id$`)

---

## In-Progress Work: Add Files Feature

**Status: Code written, NOT committed, NOT tested in browser**

The feature adds paste-code and file-upload support for manual sessions (non-GitHub).

### Uncommitted Files

| File | Status | Description |
|------|--------|-------------|
| `packages/client/src/pages/dashboard/AddFilesDialog.tsx` | **NEW** | Main dialog component |
| `packages/client/src/pages/Dashboard.tsx` | Modified | Wired up AddFilesDialog after session creation |
| `packages/client/src/pages/dashboard/index.ts` | Modified | Added export |

### How It Works

1. User clicks "+ New Session" → `NewSessionDialog` creates session
2. After creation, `AddFilesDialog` opens with the new session ID
3. Dialog has two tabs:
   - **Paste Code**: Enter filename + code. Optional "original version" for diff comparison.
   - **Upload Files**: Click/drag-drop file upload (multiple, max 1MB each)
4. Files are staged locally, then batch-uploaded via `POST /api/sessions/:id/files`
5. After upload (or skip), navigates to the session page

### What's Left to Do

- [ ] Test the dialog in the browser (was about to when conversation ended)
- [ ] The dialog compiles clean (`bun tsc --noEmit` passes) but hasn't been visually verified
- [ ] Consider adding an "Add Files" button inside the Session page too (for adding files later)
- [ ] Commit once verified working

---

## Recent Changes (Feb 8, 2026)

### Full Codebase Review & 58+ Fixes (4 Phases)

**Phase 1: Security Hardening** (commit `691b5ab`)
- Switched password hashing from SHA-256 to argon2id (`Bun.password.hash()`)
- JWT_SECRET validated on startup in production; random dev default
- Added authorization checks to ALL file/comment/chat routes (IDOR fixes)
- Signed OAuth state with HMAC (prevents user impersonation)
- Added session access check to WebSocket upgrade handler
- Fixed cookie `path: '/'` on set and delete
- Configured DB connection pool (max:20, idle_timeout:30)
- Added graceful shutdown handler (SIGTERM/SIGINT)

**Phase 2: API Bug Fixes** (commit `655cbc4`)
- Fixed broken comment sync (blanket UPDATE marked ALL comments synced)
- Fixed N+1 queries in status update (batch user lookup)
- Fixed session listing (owned+participated, not all public)
- Fixed WebSocket multi-tab support (connectionId instead of userId)
- Added 9 DB indexes + unique constraint on sessionParticipants
- Removed dead code (4 unused exported functions)
- Parallelized PR file processing (batch of 5 concurrent)
- Removed unused Redis from docker-compose

**Phase 3: Client Cleanup** (commit `a6cc7de`)
- Removed 36 unused dependencies (26 @radix-ui, lucide-react, etc.)
- Deleted 6 dead components (CursorOverlay, PageHeader, UserMenu, etc.)
- Extracted shared store boilerplate to `lib/store.ts` (~100 lines removed)
- Replaced 11 `any` types with proper types
- Fixed useQuery/useMutation option tracking
- Capped WebSocket chat at 500 messages
- Fixed auth store init retry, settings memory leak

**Phase 4: Infrastructure** (commit `b0f3e38`)
- Generated & applied migration 0003 (indexes + unique constraint)
- Fixed all lint warnings to 0

**Post-Review Fixes:**
- `e94c3ad` — Re-added tailwindcss-animate (used via CSS @plugin, not JS import)
- `5d624c1` — Legacy password migration (SHA-256→argon2id on login)
- `7de3ba1` — Fixed GitHub review submit (removed unsupported `side`/`line` fields)

---

## Project Structure

```
codesync/
├── packages/
│   ├── api/                 # Hono backend (port 8001)
│   │   └── src/
│   │       ├── config.ts    # Environment config (validates JWT_SECRET in prod)
│   │       ├── index.ts     # Server entry + WS upgrade + session access check
│   │       ├── app.ts       # Hono routes
│   │       ├── routes/
│   │       │   ├── auth.ts  # Login/register with argon2id + legacy migration
│   │       │   ├── sessions.ts
│   │       │   ├── files.ts # All routes have session access checks
│   │       │   ├── comments.ts # All routes have session access checks
│   │       │   ├── chat.ts  # Session access + bounded limit
│   │       │   └── github/  # OAuth (HMAC-signed state) + import + sync
│   │       ├── services/
│   │       │   ├── github/  # PR fetching, file processing (parallel), review sync
│   │       │   └── session/ # Access control (checks participants table)
│   │       ├── middleware/
│   │       │   └── auth.ts  # JWT middleware
│   │       ├── db/
│   │       │   ├── client.ts # Connection pool (max:20)
│   │       │   └── schema.ts # With indexes + unique constraints
│   │       ├── ws/
│   │       │   └── index.ts # Multi-tab support via connectionId
│   │       └── utils/
│   │
│   ├── client/              # Hono JSX-DOM frontend (port 5173)
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── Dashboard.tsx # Wired to AddFilesDialog
│   │       │   ├── dashboard/
│   │       │   │   ├── AddFilesDialog.tsx # NEW — paste/upload files
│   │       │   │   ├── NewSessionDialog.tsx
│   │       │   │   └── ImportPRDialog/
│   │       │   ├── Session.tsx
│   │       │   └── ...
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── stores/      # Uses shared lib/store.ts
│   │       ├── lib/
│   │       │   ├── store.ts # Shared createStoreHook + shallowEqual
│   │       │   ├── query.ts # Fixed useQuery (watches enabled), useMutation (updates options)
│   │       │   └── ...
│   │       └── api/
│   │           └── client.ts # No more hc<AppType>, just apiCall()
│   │
│   └── shared/              # Shared types & schemas
│
├── .env                     # NOT in git — must create manually
├── .env.example             # Template
├── docker-compose.yml       # PostgreSQL only (Redis removed)
├── REVIEW.md                # Full 58-issue review document
└── ...
```

---

## Key Technical Notes

### Auth Flow
- JWT tokens stored in httpOnly cookies + localStorage (dual)
- Token extracted from `Authorization: Bearer` header or `token` cookie
- Cookie has `path: '/'`, `sameSite: Lax`, `httpOnly: true`

### Session Access Model
- `checkSessionAccess()` checks: owner → participant → public
- `checkFileAccess()` looks up file → gets sessionId → checks session access
- `sessionParticipants` table has unique constraint on `(sessionId, userId)`
- WebSocket upgrade also checks session access

### GitHub Integration
- OAuth uses HMAC-signed state parameter (contains userId, nonce, expiry)
- PR import fetches files in parallel batches of 5
- Review sync uses `position` only (not `line`/`side`) for `createReview` API
- `github_id` column is unique — must clear old link before connecting new account

---

## Useful Commands

```bash
# Check server logs
tail -f /tmp/api.log
tail -f /tmp/client.log

# Kill servers
fuser -k 8001/tcp 5173/tcp

# Type check
bun run typecheck

# Lint
bun run lint

# Database
cd packages/api && bun run db:studio

# Check password hash format in DB
docker exec codesync-postgres psql -U codesync -c "SELECT email, substring(password_hash, 1, 30) FROM users;"
```
