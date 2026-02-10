# CodeSync TODO

## Current State (Feb 10, 2026)

**Status: FEATURE COMPLETE** — All core features working, real-time polished, role-based workflow in place.

| Category | Status |
|----------|--------|
| Core Features | ✅ Complete |
| Real-time (WS) | ✅ Polished (color sync, dedup, throttle, payload limits) |
| GitHub Integration | ✅ OAuth + PR import + review sync |
| Review Workflow | ✅ Role-gated (owner/reviewer/viewer) |
| Keyboard Shortcuts | ✅ 8 shortcuts + help modal |
| Share Sessions | ✅ Token-based public links |
| Security Review | ✅ 58+ fixes applied |
| TypeScript | ✅ 0 errors |
| Lint | ✅ 0 warnings |
| E2E Tests | ❌ Not started |

---

## 🔴 NEXT UP (High Priority)

### 1. E2E Tests with Playwright
- [ ] Set up Playwright config + first test
- [ ] Test: register → login → create session → add file → add comment → resolve
- [ ] Test: GitHub OAuth flow (mock)
- [ ] Test: share session via link → view as anonymous
- [ ] Test: review workflow (draft → in_review → approved → merged)
- [ ] Add to CI pipeline (`.github/workflows/ci.yml`)
- **Effort:** 3-4 hours

### 2. Rate Limiting on Auth Endpoints
- [ ] Add rate limiter middleware (e.g., 5 login attempts/minute per IP)
- [ ] Apply to `/api/auth/login`, `/api/auth/register`
- [ ] Consider WS message rate limiting (cursor: 50/sec, chat: 5/sec)
- **Effort:** 1-2 hours

### 3. WS Ping/Pong Heartbeat
- [ ] Server-side periodic ping (every 30s) to detect dead connections
- [ ] Client-side `visibilitychange` listener to check connection health on wake
- [ ] Reset stale presence/cursors on reconnect
- **Effort:** 1 hour

---

## 🟡 SHOULD DO (Medium Priority)

### Code Quality
- [ ] Fix `any` type: `sessions: any[]` in `Dashboard.tsx:163` → `Session[]`
- [ ] Fix `InlineCommentPanel` hardcoded `left-64` (breaks when sidebar hidden)
- [ ] Replace O(n×m) LCS diff with Myers' diff (`lib/diff.ts`, 242 lines)
- [ ] Add error boundaries for diff rendering
- [ ] FileTree: add `aria-selected`, `role="treeitem"` for accessibility
- [ ] Re-enable Biome a11y rules and fix violations

### UX Polish
- [ ] Chat "is typing" indicator
- [ ] Optimistic UI for chat sends (don't wait for server round-trip)
- [ ] Cursor idle timeout (remove cursor after 5min inactive)
- [ ] "You" indicator in OnlineUsers avatar list
- [ ] Comment threads / replies

### Infrastructure
- [ ] Auto-deploy pipeline (GitHub Actions → SSH to server on merge)
- [ ] Database backup automation
- [ ] Monitoring & alerting

---

## 🟢 NICE TO HAVE (Low Priority)

### Features
- [ ] Email notifications (new comments, status changes)
- [ ] @mentions with autocomplete in comments/chat
- [ ] Multi-file batch review
- [ ] Review templates
- [ ] Activity feed
- [ ] Light theme testing/polish

### Infrastructure
- [ ] Redis for WebSocket pub/sub (horizontal scaling)
- [ ] Load testing
- [ ] Replace Sonner toast with Hono-native solution (saves ~40KB)

---

## ✅ COMPLETED

### Core Application
- [x] JWT Authentication (login/register/logout)
- [x] Password hashing with argon2id + legacy SHA-256 migration
- [x] Session CRUD with status workflow (draft → in_review → approved → merged)
- [x] Role-based review workflow (owner/reviewer can change status; viewers cannot)
- [x] File management with diff viewer (unified + split modes)
- [x] Syntax highlighting (25+ languages via Prism.js)
- [x] Inline comments on specific lines
- [x] Mark files as reviewed
- [x] Add files via paste/upload

### Real-time Collaboration (Polished Feb 10)
- [x] WebSocket with JWT authentication + session access check
- [x] Multi-tab support (connectionId-based)
- [x] User presence (online users list)
- [x] Real-time chat with persistence (capped at 500 messages)
- [x] Chat message deduplication (REST history + WS race fix)
- [x] Chat message length validation (max 2000 chars on WS)
- [x] Cursor position broadcasting
- [x] Cursor send throttling (50ms)
- [x] WS payload limit (64KB) + idle timeout (120s)
- [x] Unified `getUserColor` in @codesync/shared (server/client match)
- [x] Auto-reconnect with exponential backoff

### GitHub Integration
- [x] GitHub OAuth connection (HMAC-signed state)
- [x] PR import with parallel file/diff fetching
- [x] Push reviews to GitHub PRs (APPROVE/COMMENT)
- [x] Comment sync tracking

### UI/UX
- [x] Keyboard shortcuts (8 shortcuts + `?` help modal)
- [x] Share sessions with public links (nanoid tokens)
- [x] User settings (theme, diff mode, view mode)
- [x] Toast notifications
- [x] Mobile responsive design
- [x] Dark theme with glass morphism

### Security Hardening
- [x] argon2id password hashing
- [x] JWT_SECRET validated on startup in production
- [x] Authorization on ALL file/comment/chat routes (IDOR fixes)
- [x] Session access checks via participants table
- [x] WebSocket session access control
- [x] OAuth cookie signing (HMAC)
- [x] DB connection pool (max:20, idle_timeout:30)
- [x] Graceful shutdown handler

### Code Quality
- [x] Removed 36 unused client dependencies
- [x] 0 TODO/FIXME remaining in codebase
- [x] 0 TypeScript errors, 0 lint warnings
- [x] 9 DB indexes + unique constraints

### Infrastructure
- [x] GitHub Actions CI (typecheck, lint, build)
- [x] Systemd service files
- [x] Deployment docs + .env templates
- [x] Docker Compose for PostgreSQL

---

## Quick Start

```bash
# Start database
cd /home/exedev/codesync && docker compose up -d postgres

# Start both servers
export PATH="$HOME/.bun/bin:$PATH"
bun run dev
```

**URLs:**
- Local: http://localhost:5173 (frontend), http://localhost:8001 (API)
- Public: https://noon-disk.exe.xyz:5173

**Test Account:**
- Email: `test2@example.com` / Password: `password123`
