# CodeSync — Full Codebase Review

**Date:** January 28, 2026  
**Scope:** All 3 packages (api, client, shared) + infrastructure  
**Files Analyzed:** ~120 source files across ~565K total lines

---

## Executive Summary

CodeSync is a well-structured monorepo with clean separation between API, client, and shared packages. The Meteor → Hono migration is functionally complete. However, the codebase has **8 critical security vulnerabilities**, **significant bundle bloat** (~30 unused npm packages), **authorization gaps** on most API endpoints, and several bugs that would cause issues at scale.

| Severity | Count |
|----------|-------|
| 🔴 Critical (Security/Broken) | 13 |
| 🟠 High (Bugs/Logic Errors) | 12 |
| 🟡 Medium (Perf/Quality) | 18 |
| 🔵 Low (Cleanup/Polish) | 15+ |
| **Total** | **58+** |

---

## 🔴 CRITICAL — Must Fix

### C1. Insecure Password Hashing
**File:** `packages/api/src/routes/auth.ts` lines 106-111  
**Issue:** SHA-256 with a single static global salt. Not iterated, not per-user salted, trivially rainbow-tabled.  
**Fix:** Use `Bun.password.hash()` (argon2id). Existing passwords need migration.

### C2. Hardcoded Default JWT Secret
**File:** `packages/api/src/config.ts` line 14  
**Issue:** Falls back to `'your-secret-key-change-in-production'` — anyone can forge tokens.  
**Fix:** `throw` on startup if `JWT_SECRET` is not set. Generate random dev defaults.

### C3. GitHub Access Tokens Stored Plaintext
**File:** `packages/api/src/db/schema.ts` line 22  
**Issue:** OAuth tokens with `repo` scope (full private repo access) in plaintext DB.  
**Fix:** AES-256-GCM encryption at rest with a server-side key.

### C4. Missing Authorization on File Routes (IDOR)
**File:** `packages/api/src/routes/files.ts`  
**Issue:** All 5 endpoints (GET, PATCH, DELETE, mark-reviewed, unmark-reviewed) have **zero session access checks**. Any authenticated user can read/modify/delete any file by guessing its ID.  
**Fix:** Check session ownership/participation before every file operation.

### C5. Missing Authorization on Comment Routes (IDOR)
**File:** `packages/api/src/routes/comments.ts`  
**Issue:** `GET /files/:fileId/comments`, `POST/DELETE /comments/:id/resolve` — no session access check.  
**Fix:** Verify the user has access to the parent session.

### C6. Missing Authorization on Chat Routes (IDOR)
**File:** `packages/api/src/routes/chat.ts`  
**Issue:** Any authenticated user can read/post messages to any session.  
**Fix:** Add `checkSessionAccess()` to both endpoints.

### C7. Unsigned OAuth Cookie Allows User Impersonation
**File:** `packages/api/src/routes/github/oauth.ts` lines 40-46  
**Issue:** `github_oauth_user` cookie contains a plain userId — a malicious user can modify it to link GitHub to another user's account.  
**Fix:** HMAC-sign the cookie, or embed userId in the OAuth `state` parameter.

### C8. Port Default Mismatch
**File:** `packages/api/src/config.ts`  
**Issue:** Config defaults to port `8000`, but `.env.example`, Vite proxy, nginx, systemd, and all docs expect `8001`. Missing `PORT` env var → broken connections.  
**Fix:** Change default to `'8001'`.

### C9. ~30 Unused Dependencies in Client
**File:** `packages/client/package.json`  
**Issue:** All 26 `@radix-ui/react-*` packages, plus `cmdk`, `date-fns`, `embla-carousel-react`, `input-otp`, `next-themes`, `react-day-picker`, `react-resizable-panels`, `recharts`, `tailwindcss-animate`, `vaul`, `zod` — **zero imports** anywhere. These are React packages in a Hono JSX-DOM project.  
**Fix:** Remove all ~30 unused packages. Saves 500KB+ and eliminates React/Hono incompatibility.

### C10. `.env.production` Likely Tracked in Git
**File:** `.gitignore` + `.env.production`  
**Issue:** `.gitignore` lists `.env` but not `.env.production`. Real JWT secrets may be committed.  
**Fix:** Add `.env.production` to `.gitignore`, rotate all secrets.

### C11. Broken Comment Sync — Blanket UPDATE
**File:** `packages/api/src/routes/github/sync.ts` lines 128-135  
**Issue:** After syncing selected comments to GitHub, a blanket `UPDATE` marks ALL session comments as synced (not just the ones actually synced).  
**Fix:** Remove the blanket update; the per-comment loop below is sufficient.

### C12. WebSocket Has No Session Access Control
**File:** `packages/api/src/ws/index.ts`  
**Issue:** Any user with a valid JWT can connect to any session's WebSocket — the upgrade handler only validates the JWT, not session access.  
**Fix:** Verify session access during the WebSocket upgrade handshake.

### C13. Redis in Docker Compose but Never Used
**File:** `docker-compose.yml`  
**Issue:** Redis service runs but zero Redis usage in API code. Wasted resource.  
**Fix:** Remove from docker-compose (add back when implementing pub/sub).

---

## 🟠 HIGH — Bugs & Logic Errors

### H1. N+1 Queries in Session Status Update
**File:** `packages/api/src/routes/sessions.ts` lines 148-168  
**Issue:** 3 sequential user lookups after updating status. Use a single `WHERE id IN (...)` query.

### H2. WebSocket Overwrites on Multi-Tab
**File:** `packages/api/src/ws/index.ts` line 86  
**Issue:** Second tab overwrites first tab's connection in the Map. First tab silently loses WebSocket.  
**Fix:** Use connection ID (not userId) as map key.

### H3. Session Listing Returns ALL Public Sessions
**File:** `packages/api/src/routes/sessions.ts` lines 19-22  
**Issue:** `WHERE createdBy = ? OR isPublic = true` returns every public session in the system.  
**Fix:** Only show user's own sessions + sessions they're a participant of.

### H4. `sessionParticipants` Table Unused for Access Control
**File:** `packages/api/src/services/session/access.ts`  
**Issue:** Access check only looks at `createdBy` and `isPublic`. The participants table is ignored.  
**Fix:** Integrate participants into all access checks.

### H5. 3× Duplicated Store Boilerplate
**Files:** `packages/client/src/stores/auth.ts`, `github.ts`, `settings.ts`  
**Issue:** Identical `shallowEqual` function (12 lines) and `useXStore` hook (20 lines) copy-pasted 3 times.  
**Fix:** Extract to `lib/store.ts`.

### H6. 7 Dead Components
**Files:** `CursorOverlay`, `PageHeader`, `UserMenu`, `GitHubStatus`, `Dropdown`/`DropdownItem`, `Alert`  
**Fix:** Delete them.

### H7. 11 `any` Types in Data Layer
**Files:** `useComments.ts`, `useSession.ts`, `Dashboard.tsx`, `router.tsx`, `UserMenu.tsx`  
**Fix:** Replace with proper types: `Session[]`, `Comment[]`, `Child`.

### H8. Double Sidebar Bug
**Files:** `FileTree.tsx` wraps in `<aside>`, inside `FileTreeSidebar` which also wraps in `<aside>`.  
**Fix:** Make `FileTree` a plain `<div>`.

### H9. Mixed `class` vs `className` (20+ instances)
**Files:** `ChatPanel.tsx`, `CursorOverlay.tsx`, `OnlineUsers.tsx`  
**Fix:** Standardize to `className=` everywhere.

### H10. `@ts-nocheck` in `dropdown-menu.tsx`
**Issue:** Suppresses all type checking because `lucide-react` returns React types.  
**Fix:** Replace with inline SVGs (like `icons/index.tsx`).

### H11. No Database Indexes
**File:** `packages/api/src/db/schema.ts`  
**Missing indexes on:** `files.sessionId`, `comments.fileId`, `comments.sessionId`, `chatMessages.sessionId`, `sessionParticipants(sessionId, userId)`, `sessions.shareToken`, `sessions.createdBy`.  
**Fix:** Add index definitions in schema.

### H12. `session_participants` Missing Unique Constraint
**Issue:** No unique on `(sessionId, userId)` — duplicate participants possible.  
**Fix:** Add composite unique constraint.

---

## 🟡 MEDIUM — Performance & Quality

### M1. No Rate Limiting on Auth Endpoints
Login/register have no rate limiting. Brute-force trivial.

### M2. Sequential PR File Processing
**File:** `services/github/file-processor.ts`  
100+ sequential HTTP calls for large PRs. Use `Promise.all` with concurrency limit (p-limit).

### M3. No Database Connection Pool Config
**File:** `packages/api/src/db/client.ts`  
No `max`, `idle_timeout`, etc. Will exhaust connections under load.

### M4. Chat Limit Not Bounded
**File:** `routes/chat.ts`  
Client can pass `limit=999999999`. Add `Math.min(limit, 200)`.

### M5. No Pagination on Sessions or Files
List endpoints return all rows. Will degrade at scale.

### M6. LCS Diff Algorithm — O(n×m) Memory
**File:** `packages/client/src/lib/diff.ts`  
5000-line files create 25M-element 2D arrays. Use Myers' algorithm.

### M7. Sonner Toast Bundles React + ReactDOM
**File:** `components/ui/sonner.tsx`  
Pulls in ~40-50KB gzipped just for toasts. Consider a Hono-native toast.

### M8. `hc<AppType>` Typed RPC Client Created but Never Used
**File:** `packages/client/src/api/client.ts`  
All calls use untyped `apiCall()`. Either use the typed client or remove it.

### M9. WebSocket Chat Messages Grow Unboundedly
**File:** `hooks/useWebSocket.ts`  
Each message appends to array. Cap at 500 messages.

### M10. Memory Leak in Settings Store
**File:** `stores/settings.ts`  
Media query listener never removed. Also `initSettings()` is never called.

### M11. Race Condition in `useOAuthCallback`
`onSuccess` not memoized → effect re-fires on each render.

### M12. `useQuery` Only Watches `queryKey`
Ignores `enabled` changes. Observer won't re-execute when `enabled` flips.

### M13. `useMutation` Never Updates Observer Options
Stale closure risk for mutation callbacks.

### M14. `comments.parentId` No Foreign Key
Self-referential FK missing. Orphaned comment references possible.

### M15. `updatedAt` Not Auto-Updating
Manual `new Date()` in some routes but not all. Add `.$onUpdate()`.

### M16. Type Drift: Shared Types vs DB Schema
Manually kept in sync. No `$inferSelect`. Add a column, forget to update shared type → stale client types.

### M17. Production Client Uses `vite preview`
Not a production server. Use nginx or busybox httpd to serve `dist/`.

### M18. `.gitignore` Missing `dist/`
Build output could be accidentally committed.

---

## 🔵 LOW — Cleanup & Polish

### L1. Dead Code in API
- `checkRepoWriteAccess`, `getPRHeadSha`, `getCommitShaForLine`, `mapDiffPositionToLine` — exported but never called.

### L2. Duplicated Octokit Instantiation
`review-sync.ts` creates its own `new Octokit()` instead of using `createOctokit()`.

### L3. Inconsistent Error Response Formats
Some routes return `{ error }`, others `{ error, code, message }`, others `{ success: true }`.

### L4. Missing Cookie `path: '/'`
Auth token cookie may not be sent to all routes without explicit path.

### L5. No Graceful Shutdown Handler
No `SIGTERM` handler to close DB connections and drain WebSockets.

### L6. Variable Typo `odId`
**File:** `ws/index.ts` line 63. Should be `userId` or `connId`.

### L7. `corsOrigin` Single String
Doesn't support multiple origins for staging + production.

### L8. No Input Length Validation
Chat messages, comments, session descriptions — no max length on text fields.

### L9. Session Page Prop Drilling (15+ props)
Consider a `SessionContext` or Zustand store for session-scoped state.

### L10. UnifiedDiff Missing `useMemo` for `cursorsByLine`
`SplitDiff` has it; `UnifiedDiff` doesn't.

### L11. Auth Store `init()` Can't Retry After Failure
Module-level `initialized = true` set before async completes.

### L12. `InlineCommentPanel` Hardcoded `left-64`
Assumes sidebar is always visible at 256px.

### L13. No Error Boundaries
Component crash takes down entire app.

### L14. Biome Disables 5 Accessibility Rules
Should re-enable and fix the violations.

### L15. Date Serialization Mismatch
Shared types say `Date`, wire format is `string`. Client receives strings.

---

## Recommended Action Plan

### Phase 1: Security Hardening (Day 1)
| # | Task | Effort |
|---|------|--------|
| C1 | Switch to argon2id password hashing | 30 min |
| C2 | Validate JWT_SECRET on startup | 10 min |
| C3 | Encrypt GitHub tokens at rest | 1 hour |
| C4-C6 | Add authorization to file/comment/chat routes | 2 hours |
| C7 | Sign OAuth state cookie | 30 min |
| C10 | Fix .gitignore + rotate secrets | 10 min |
| C12 | Add session access check to WebSocket | 30 min |
| M1 | Add rate limiting to auth endpoints | 30 min |

### Phase 2: Bug Fixes (Day 2)
| # | Task | Effort |
|---|------|--------|
| C8 | Fix port default 8000→8001 | 1 min |
| C11 | Fix comment sync blanket update | 15 min |
| H1 | Fix N+1 queries in status update | 15 min |
| H2 | Fix multi-tab WebSocket overwrite | 30 min |
| H3-H4 | Fix session listing + use participants table | 1 hour |
| H8 | Fix double sidebar bug | 5 min |
| H11-H12 | Add DB indexes + unique constraints | 30 min |

### Phase 3: Cleanup (Day 3)
| # | Task | Effort |
|---|------|--------|
| C9 | Remove ~30 unused client deps | 15 min |
| C13 | Remove unused Redis from docker-compose | 5 min |
| H5 | Extract shared store boilerplate | 30 min |
| H6 | Delete 7 dead components | 15 min |
| H7 | Replace 11 `any` types | 20 min |
| H9 | Fix mixed class/className | 20 min |
| H10 | Replace lucide-react with inline SVGs | 30 min |
| L1-L6 | Remove dead code, fix typos | 30 min |

### Phase 4: Performance (Day 4)
| # | Task | Effort |
|---|------|--------|
| M2 | Parallelize PR file processing | 30 min |
| M3 | Configure DB connection pool | 10 min |
| M4-M5 | Add pagination + query limits | 1 hour |
| M6 | Optimize diff algorithm | 2 hours |
| M7-M8 | Replace React toast, use or remove hc client | 2 hours |
| M9 | Cap WebSocket message buffer | 15 min |

---

## What's Good ✅

- **Clean monorepo structure** with proper workspace separation
- **Shared Zod schemas** for validation + type inference
- **Well-designed WebSocket protocol** with discriminated unions
- **Modular API routes** — clean decomposition after the refactor
- **Good UI component library** with consistent shadcn-style patterns
- **Diff viewer** works well with both unified and split modes
- **GitHub integration** (OAuth + PR import + review sync) is feature-complete
- **Mobile responsive design** already implemented
- **CI pipeline** with type-checking and linting
- **Conventional commit messages** throughout history
