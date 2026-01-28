# CodeSync TODO

## Current State (Jan 28, 2026)

**Status: READY FOR RELEASE** — All core features complete, code quality verified.

| Category | Status |
|----------|--------|
| Core Features | ✅ Complete |
| TypeScript | ✅ 0 errors |
| Lint | ✅ 0 warnings |
| Old Meteor Code | ✅ Removed |
| Production Config | ⚠️ Needed |
| CI/CD | ⚠️ Needed |
| E2E Tests | ⚠️ Needed |

---

## 🚀 RELEASE BLOCKERS (Must Do)

### 1. Production Environment Setup
- [ ] Create `.env.example` with all required variables
- [ ] Create `.env.production` template
- [ ] Document required secrets (JWT_SECRET, GITHUB_CLIENT_ID, etc.)

### 2. Systemd Service Files
- [ ] `codesync-api.service` for backend
- [ ] `codesync-client.service` for frontend (or static build)
- [ ] Install and enable services

### 3. CI/CD Pipeline (GitHub Actions)
- [ ] Type checking on PR
- [ ] Lint checking on PR
- [ ] Build verification
- [ ] (Optional) Auto-deploy on merge to main

---

## 🟡 SHOULD DO (Before Public Release)

### Testing
- [ ] Basic E2E test with Playwright (login, create session, add comment)
- [ ] API route unit tests for critical paths
- [ ] WebSocket connection tests

### Security
- [ ] Rate limiting on auth endpoints
- [ ] Input sanitization audit
- [ ] CORS configuration for production

### Documentation
- [ ] README with setup instructions
- [ ] API documentation
- [ ] Deployment guide

---

## 🟢 NICE TO HAVE (Post-Release)

### Polish & UX
- [ ] Light theme testing/polish
- [ ] File upload drag & drop
- [ ] Cursor debouncing & animations
- [ ] Typing indicators in chat
- [ ] @mentions with autocomplete

### New Features
- [ ] Comment threads (replies)
- [ ] Multi-file batch review
- [ ] Review templates
- [ ] Activity feed & notifications

### Infrastructure
- [ ] Database backup automation
- [ ] Monitoring & alerting
- [ ] Load testing

---

## ✅ COMPLETED FEATURES

### Core Application
- [x] JWT Authentication (login/register/logout)
- [x] Session CRUD with status workflow (draft → in_review → approved → merged)
- [x] File management with diff viewer (unified + split modes)
- [x] Syntax highlighting (25+ languages via Prism.js)
- [x] Inline comments on specific lines
- [x] Mark files as reviewed

### Real-time Collaboration
- [x] WebSocket with JWT authentication
- [x] User presence (online users list)
- [x] Real-time chat with persistence
- [x] Cursor position broadcasting
- [x] Auto-reconnect with exponential backoff

### GitHub Integration
- [x] GitHub OAuth connection
- [x] PR import with file/diff fetching
- [x] Push reviews to GitHub PRs (APPROVE/COMMENT)
- [x] Comment sync tracking

### UI/UX
- [x] Keyboard shortcuts (`?` for help, `j/k` navigation)
- [x] Share sessions with public links
- [x] User settings (theme, diff mode, view mode)
- [x] Toast notifications
- [x] Mobile responsive design

### Code Quality
- [x] TypeScript strict mode (0 errors)
- [x] Biome linting (0 warnings)
- [x] Modular code organization
- [x] Shared types package

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Bun 1.3.6 |
| Backend | Hono 4.11 + Drizzle ORM |
| Database | PostgreSQL 16 |
| Frontend | Hono JSX-DOM + Vite 7 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Validation | Zod 4 |
| Real-time | Bun WebSocket |

---

## Quick Start

```bash
# Start database
cd /home/exedev/codesync && docker compose up -d postgres

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

---

## Environment Variables

```bash
# Required for production
JWT_SECRET=your-secure-secret-here
PASSWORD_SALT=your-secure-salt-here
DATABASE_URL=postgres://user:pass@host:5432/codesync
GITHUB_CLIENT_ID=your-github-app-id
GITHUB_CLIENT_SECRET=your-github-app-secret

# Optional
PORT=8001
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
FRONTEND_URL=https://your-domain.com
```
