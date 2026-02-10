# Agent Context Dump

**Last Updated:** Feb 10, 2026  
**Last Task:** Polish real-time features + add review role gating

---

## Current Project State

CodeSync is a real-time collaborative code review platform. All core features are complete and polished. The app is fully functional.

### Codebase Stats
- **121 source files**, **13,137 lines** of TypeScript/TSX
- **0 TypeScript errors**, **0 lint warnings**, **0 TODOs in code**
- **3 packages**: `@codesync/api`, `@codesync/client`, `@codesync/shared`

### Running Services

```bash
# Start PostgreSQL
cd /home/exedev/codesync && docker compose up -d postgres

# Start both servers (API on 8001, Client on 5173)
export PATH="$HOME/.bun/bin:$PATH"
bun run dev
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

If `.env` is missing, the API uses a **random JWT secret** on each restart, invalidating all tokens.

### Live URLs

- **Frontend**: https://noon-disk.exe.xyz:5173/
- **API**: https://noon-disk.exe.xyz:8001/
- **Health**: https://noon-disk.exe.xyz:8001/health

### Test Accounts

| Email | Password | Notes |
|-------|----------|-------|
| `test2@example.com` | `password123` | Main test, GitHub connected (HexSleeves) |
| `review-test@example.com` | `testpass123` | Created during review phase |
| `lecoqjacob@gmail.com` | `password123` | Owner's account |

---

## Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Auth (argon2id + legacy migration) | ✅ | JWT in httpOnly cookies |
| Sessions CRUD | ✅ | Owner/participant/public access model |
| Review Workflow | ✅ | Role-gated: owner/reviewer can change, viewers can't |
| Diff Viewer (unified + split) | ✅ | 25+ language syntax highlighting |
| Inline Comments | ✅ | Line-level, resolve/unresolve |
| File Tree + Reviewed Status | ✅ | |
| WebSocket Real-time | ✅ | Presence, cursors, chat — all polished |
| Chat | ✅ | Persisted, deduped, length-validated, capped at 500 |
| Keyboard Shortcuts | ✅ | 8 shortcuts + help modal |
| Share Sessions | ✅ | nanoid tokens, read-only public view |
| GitHub OAuth + PR Import | ✅ | HMAC-signed state, parallel file fetch |
| GitHub Review Sync | ✅ | Push APPROVE/COMMENT to GH PRs |
| CI Pipeline | ✅ | GitHub Actions: typecheck + lint + build |
| E2E Tests | ❌ | Not started |
| Email Notifications | ❌ | Not started |
| Rate Limiting | ❌ | Not started |

---

## Recent Changes (Feb 10, 2026)

### Real-time Polish (commit `bac78e5`)
- **Unified `getUserColor`** — moved to `@codesync/shared`, server & client now match
- **Chat deduplication** — prevents duplicates from REST history + WS race
- **Chat length validation** — max 2000 chars enforced on WS handler
- **Cursor throttle** — 50ms debounce on `handleLineHover` in Session.tsx
- **WS hardening** — `maxPayloadLength: 64KB`, `idleTimeout: 120s`
- **Review role gating** — backend enforces roles, frontend hides buttons for viewers
- **PRList back button** — added to empty "No pull requests found" state
- **Removed lucide-react** — replaced with inline SVG in PRList

---

## Project Structure

```
codesync/
├── packages/
│   ├── api/                 # Hono backend (port 8001)
│   │   └── src/
│   │       ├── config.ts    # Env config (validates JWT_SECRET in prod)
│   │       ├── index.ts     # Bun.serve + WS upgrade + access check
│   │       ├── app.ts       # Hono routes
│   │       ├── routes/      # auth, sessions, files, comments, chat, github/
│   │       ├── services/    # github/ (PR fetch, review sync), session/ (access)
│   │       ├── middleware/   # JWT auth
│   │       ├── db/          # schema, client (pool), migrations, seed
│   │       └── ws/          # Multi-tab WS with connectionId
│   ├── client/              # Hono JSX-DOM frontend (port 5173)
│   │   └── src/
│   │       ├── pages/       # Home, Login, Dashboard, Session, SharedSession
│   │       ├── components/  # ui/, session/, comment/, layout/, icons/, modals/
│   │       ├── hooks/       # useWebSocket, useComments, useSession, useKeyboardShortcuts
│   │       ├── stores/      # auth, settings
│   │       ├── lib/         # store.ts, query.ts, diff.ts, router.ts
│   │       └── api/         # client.ts (apiCall helper)
│   └── shared/              # Types, Zod schemas, ws-types + getUserColor
├── .github/workflows/ci.yml  # Typecheck + lint + build
├── plans/                    # Implementation plans (001-004)
├── docs/                     # Screenshots, deployment guide
├── TODO.md                   # This file
├── CONTEXT.md                # Agent context dump
└── docker-compose.yml        # PostgreSQL
```

---

## Key Technical Notes

### Auth Flow
- JWT in httpOnly cookies (`path: '/'`, `sameSite: Lax`) + localStorage
- Token from `Authorization: Bearer` header or `token` cookie
- argon2id hashing with transparent legacy SHA-256 migration on login

### Session Access Model
- `checkSessionAccess()`: owner → participant → public
- `checkSessionOwnership()`: owner only
- `checkFileAccess()`: file → session → access check
- WebSocket upgrade also checks session access
- Status changes: owner & reviewer roles only (viewers get 403)

### WebSocket
- Multi-tab via connectionId (nanoid)
- Presence broadcasts full `onlineUsers` array
- Chat persisted to DB, broadcast to all (including sender)
- Cursors broadcast to others only (not sender)
- `maxPayloadLength: 64KB`, `idleTimeout: 120s`
- Client: exponential backoff reconnect (1s→30s, max 5 attempts)
- Shared `getUserColor` in `@codesync/shared`

### GitHub Integration
- OAuth with HMAC-signed state (userId, nonce, expiry)
- PR import: parallel file fetch (batches of 5)
- Review sync: `position` only (not `line`/`side`) for `createReview` API

---

## Useful Commands

```bash
# Start everything
export PATH="$HOME/.bun/bin:$PATH"
docker compose up -d postgres && bun run dev

# Type check
bun run typecheck

# Lint
bun run lint

# Database studio
cd packages/api && bun run db:studio

# Kill servers
lsof -ti:8001 -ti:5173 | xargs kill -9

# Check DB
docker exec codesync-postgres psql -U codesync -c "SELECT email, substring(password_hash, 1, 30) FROM users;"
```
