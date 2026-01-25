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
│   │       ├── routes/    # auth, sessions, files, comments, chat, github
│   │       ├── middleware/auth.ts
│   │       ├── db/schema.ts
│   │       └── ws/cursors.ts
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

1. **WebSocket Real-time**
   - [ ] Cursor broadcasting to session participants
   - [ ] Chat real-time updates
   - [ ] User presence (online/offline)
   - Handler exists at `packages/api/src/ws/cursors.ts` but no broadcast logic
   - Need Redis pub/sub for scaling
   - Reference: `imports/ui/components/CodeEditor/Cursors.tsx`

2. **Syntax Highlighting** (Optional enhancement)
   - [ ] Add Prism.js or Shiki for code highlighting in diff viewer
   - Currently shows plain text

### MEDIUM PRIORITY

3. **Chat Panel UI**
   - [ ] Chat sidebar component in Session page
   - [ ] Real-time message updates via WebSocket
   - [ ] Message input and send
   - API endpoints exist (`/api/sessions/:id/chat`)
   - Reference: `imports/ui/components/Sidebar/ChatPanel.tsx`

4. **User Presence UI**
   - [ ] Online users list in session sidebar
   - [ ] Cursor positions shown on code lines
   - [ ] User avatars/colors
   - Reference: `imports/ui/components/Sidebar/UserList.tsx`

### LOW PRIORITY

5. **UI Polish**
   - [ ] Keyboard shortcuts modal (? key)
   - [ ] Share session button/modal
   - [ ] Settings modal
   - [ ] File upload drag & drop
   - [ ] TopBar with review actions (Approve, Request Changes)
   - [ ] Toast notifications (instead of Alert banners)

6. **Testing & Deployment**
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
- `packages/api/src/middleware/auth.ts` - JWT auth
- `packages/api/src/db/schema.ts` - Drizzle schema
- `packages/api/src/routes/github.ts` - GitHub OAuth + import
- `packages/api/src/ws/cursors.ts` - WebSocket handler (incomplete)
- `packages/client/src/stores/auth.ts` - Auth state management
- `packages/client/src/hooks/useAuth.ts` - Auth hook
- `packages/client/src/hooks/useGitHub.ts` - GitHub connection hook
- `packages/client/src/pages/Session.tsx` - Code review UI
- `packages/client/src/components/Diff/` - Diff viewer components
- `packages/client/src/components/ui/` - shadcn UI components

---

## NEXT STEPS (Suggested Order)

1. **WebSocket Real-time** - Core collaboration feature
   - Implement broadcast in `packages/api/src/ws/cursors.ts`
   - Add `useWebSocket` hook in client
   - Show other users' cursors on code
   - Real-time chat updates

2. **Chat Panel** - Collaboration feature
   - Add chat sidebar to Session page
   - Connect to WebSocket for real-time
   - Use existing `/api/sessions/:id/chat` endpoints

3. **User Presence** - Collaboration feature
   - Show online users in session
   - Track join/leave events

4. **Syntax Highlighting** - Polish
   - Add Prism.js or Shiki
   - Detect language from file extension

5. **UI Polish** - Final touches
   - Keyboard shortcuts
   - Share functionality
   - Toast notifications
