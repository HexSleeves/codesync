# CodeSync TODO

## Current State (Feb 8, 2026)

**Status: CORE COMPLETE** — All features working, security review done, quality hardened.

| Category | Status |
|----------|--------|
| Core Features | ✅ Complete |
| TypeScript | ✅ 0 errors |
| Lint | ✅ 0 warnings |
| Security Review | ✅ 58+ fixes applied |
| Auth (argon2id) | ✅ Complete with legacy migration |
| GitHub Integration | ✅ OAuth + PR import + review sync |
| E2E Tests | ⚠️ Needed |

---

## 🟡 IN PROGRESS

### Add Files Feature (Paste / Upload)
**Status: Code written, not committed, needs browser testing**

Files changed:
- `packages/client/src/pages/dashboard/AddFilesDialog.tsx` (NEW)
- `packages/client/src/pages/Dashboard.tsx` (modified)
- `packages/client/src/pages/dashboard/index.ts` (modified)

What's left:
- [ ] Test the AddFilesDialog in the browser
- [ ] Verify paste code flow works (filename + content + optional original)
- [ ] Verify file upload flow works (click + drag-drop)
- [ ] Verify files appear in session after upload
- [ ] Add "Add Files" button on Session page for adding more files later
- [ ] Commit once verified

---

## 🔴 NEXT UP

### Session Page: Add Files Button
- [ ] Add a "+ Add Files" button in the FileTree sidebar header
- [ ] Reuse `AddFilesDialog` from the Session page
- [ ] Allow adding files to an existing session (not just on creation)

### `any` type in Dashboard.tsx
- [ ] `sessions: any[]` in `SessionsList` — should be `Session[]`

---

## 🟡 SHOULD DO

### Testing
- [ ] Basic E2E test with Playwright (login, create session, add file, add comment)
- [ ] API route unit tests for critical paths
- [ ] WebSocket connection tests

### Security (Remaining)
- [ ] Rate limiting on auth endpoints
- [ ] Input sanitization audit
- [ ] CORS configuration for production

### Performance
- [ ] Replace O(n×m) LCS diff algorithm with Myers' diff (client `lib/diff.ts`)
- [ ] Consider replacing React-based Sonner toast with Hono-native solution (saves ~40KB)

### UX Polish
- [ ] Fix `InlineCommentPanel` hardcoded `left-64` (breaks when sidebar hidden)
- [ ] Add error boundaries / error handling for diff rendering
- [ ] FileTree: add `aria-selected`, `role="treeitem"` for accessibility
- [ ] Re-enable Biome a11y rules and fix violations

---

## 🟢 NICE TO HAVE

### Features
- [ ] Comment threads (replies)
- [ ] Multi-file batch review
- [ ] Review templates
- [ ] Activity feed & notifications
- [ ] @mentions with autocomplete
- [ ] Typing indicators in chat
- [ ] Light theme testing/polish

### Infrastructure
- [ ] Redis for WebSocket pub/sub (horizontal scaling)
- [ ] Database backup automation
- [ ] Monitoring & alerting
- [ ] Load testing
- [ ] CD pipeline (auto-deploy on merge)

---

## ✅ COMPLETED

### Core Application
- [x] JWT Authentication (login/register/logout)
- [x] Password hashing with argon2id + legacy SHA-256 migration
- [x] Session CRUD with status workflow (draft → in_review → approved → merged)
- [x] File management with diff viewer (unified + split modes)
- [x] Syntax highlighting (25+ languages via Prism.js)
- [x] Inline comments on specific lines
- [x] Mark files as reviewed

### Real-time Collaboration
- [x] WebSocket with JWT authentication + session access check
- [x] Multi-tab support (connectionId-based, not userId)
- [x] User presence (online users list)
- [x] Real-time chat with persistence (capped at 500 messages)
- [x] Cursor position broadcasting
- [x] Auto-reconnect with exponential backoff

### GitHub Integration
- [x] GitHub OAuth connection (HMAC-signed state)
- [x] PR import with parallel file/diff fetching
- [x] Push reviews to GitHub PRs (APPROVE/COMMENT)
- [x] Comment sync tracking

### Security Hardening (Feb 8, 2026)
- [x] argon2id password hashing (was SHA-256)
- [x] JWT_SECRET validated on startup in production
- [x] Authorization on ALL file/comment/chat routes (IDOR fixes)
- [x] Session access checks via participants table
- [x] WebSocket session access control
- [x] OAuth cookie signing (HMAC)
- [x] Cookie path: '/' on set and delete
- [x] DB connection pool (max:20, idle_timeout:30)
- [x] Graceful shutdown handler
- [x] Chat limit bounded (1-200)

### Code Quality (Feb 8, 2026)
- [x] Removed 36 unused client dependencies
- [x] Deleted 6 dead components
- [x] Extracted shared store boilerplate (lib/store.ts)
- [x] Replaced 11 `any` types
- [x] Fixed useQuery/useMutation option tracking
- [x] Fixed broken comment sync (blanket UPDATE bug)
- [x] Fixed N+1 queries (batch user lookup)
- [x] Fixed session listing (owned+participated only)
- [x] 9 DB indexes + unique constraint added
- [x] Parallel PR file processing
- [x] Removed dead API code (4 functions)
- [x] Removed unused Redis from docker-compose

### UI/UX
- [x] Keyboard shortcuts (`?` for help, `j/k` navigation)
- [x] Share sessions with public links
- [x] User settings (theme, diff mode, view mode)
- [x] Toast notifications
- [x] Mobile responsive design

### Infrastructure
- [x] GitHub Actions CI (typecheck, lint, build)
- [x] Systemd service files
- [x] Deployment docs
- [x] .env.example + .env.production.example

---

## Quick Start

```bash
# Start database
cd /home/exedev/codesync && docker compose up -d postgres

# IMPORTANT: Ensure .env exists in both root AND packages/api/
# Copy from .env.example if needed

# Start API (port 8001)
export PATH="$HOME/.bun/bin:$PATH"
cd packages/api && bun --hot src/index.ts

# Start Client (port 5173) - in another terminal
cd packages/client && bun run dev
```

**URLs:**
- Local: http://localhost:5173
- Public: https://noon-disk.exe.xyz:5173

**Test Account:**
- Email: `test2@example.com`
- Password: `password123`
