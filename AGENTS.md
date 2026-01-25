# CodeSync

Real-time collaborative code review app.

## Migration: Meteor → Hono (In Progress)

We are migrating from Meteor.js to a split frontend/backend architecture using Hono.

---

## Hono Documentation Reference

- **Full Docs**: <https://hono.dev/llms-full.txt>
- **Tiny Docs**: <https://hono.dev/llms-small.txt>
- **RPC Guide**: <https://hono.dev/docs/guides/rpc>
- **Client Components (JSX-DOM)**: <https://hono.dev/docs/guides/jsx-dom>
- **WebSocket Helper**: <https://hono.dev/docs/helpers/websocket>
- **JWT Middleware**: <https://hono.dev/docs/middleware/builtin/jwt>
- **Validation (Zod)**: <https://hono.dev/docs/guides/validation>

---

## Migration Plan: Meteor → Hono Full-Stack SPA

### Phase 1: Project Setup & Infrastructure

#### 1.1 New Project Structure

```
codesync/
├── packages/
│   ├── api/                    # Hono backend
│   │   ├── src/
│   │   │   ├── index.ts        # Entry point
│   │   │   ├── app.ts          # Hono app with routes
│   │   │   ├── routes/         # API route handlers
│   │   │   │   ├── auth.ts
│   │   │   │   ├── sessions.ts
│   │   │   │   ├── files.ts
│   │   │   │   ├── comments.ts
│   │   │   │   ├── chat.ts
│   │   │   │   ├── cursors.ts
│   │   │   │   └── github.ts
│   │   │   ├── middleware/     # Custom middleware
│   │   │   │   ├── auth.ts
│   │   │   │   └── permissions.ts
│   │   │   ├── services/       # Business logic
│   │   │   │   ├── github/
│   │   │   │   ├── files/
│   │   │   │   └── sessions/
│   │   │   ├── db/             # Database layer
│   │   │   │   ├── schema.ts   # Drizzle/Prisma schema
│   │   │   │   ├── client.ts   # DB client
│   │   │   │   └── migrations/
│   │   │   ├── ws/             # WebSocket handlers
│   │   │   │   ├── cursors.ts
│   │   │   │   ├── chat.ts
│   │   │   │   └── presence.ts
│   │   │   └── types.ts        # Shared types
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── client/                 # Hono JSX-DOM SPA
│   │   ├── src/
│   │   │   ├── index.tsx       # Entry point + render()
│   │   │   ├── App.tsx         # Main app component
│   │   │   ├── router.tsx      # Client-side routing
│   │   │   ├── api/            # Hono RPC client
│   │   │   │   └── client.ts   # hc<AppType>()
│   │   │   ├── components/     # UI components
│   │   │   │   ├── common/
│   │   │   │   ├── session/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── Header/
│   │   │   │   ├── FileTree/
│   │   │   │   ├── CodeEditor/
│   │   │   │   ├── Comments/
│   │   │   │   ├── Diff/
│   │   │   │   └── Sidebar/
│   │   │   ├── pages/
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Session.tsx
│   │   │   │   └── Invite.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useSession.ts
│   │   │   │   ├── useWebSocket.ts
│   │   │   │   └── ...
│   │   │   ├── stores/         # State management
│   │   │   │   ├── auth.ts
│   │   │   │   └── session.ts
│   │   │   └── utils/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/                 # Shared types & validation
│       ├── src/
│       │   ├── types.ts        # Domain types
│       │   └── schemas.ts      # Zod schemas (shared validation)
│       └── package.json
│
├── package.json                # Workspace root
├── turbo.json                  # Turborepo config (optional)
└── docker-compose.yml          # PostgreSQL + Redis
```

#### 1.2 Technology Choices

- **Runtime**: Bun (fast, native TypeScript)
- **Backend**: Hono (ultrafast, Web Standards)
- **Frontend**: Hono JSX-DOM (Client Components)
- **Database**: PostgreSQL + Drizzle ORM (replacing MongoDB)
- **Real-time**: Hono WebSocket helper + Redis pub/sub
- **Auth**: JWT tokens via Hono JWT middleware
- **Validation**: Zod (shared between client/server via RPC)
- **Styling**: Tailwind CSS (keep existing)

---

### Phase 2: Backend Migration (Hono API)

#### 2.1 Core API Routes

```typescript
// packages/api/src/app.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { jwt } from 'hono/jwt'
import { zValidator } from '@hono/zod-validator'

import { authRoutes } from './routes/auth'
import { sessionRoutes } from './routes/sessions'
import { fileRoutes } from './routes/files'
import { commentRoutes } from './routes/comments'
import { chatRoutes } from './routes/chat'
import { cursorRoutes } from './routes/cursors'
import { githubRoutes } from './routes/github'

const app = new Hono()
  .use('*', logger())
  .use('*', cors())
  .route('/api/auth', authRoutes)
  .route('/api/sessions', sessionRoutes)
  .route('/api/files', fileRoutes)
  .route('/api/comments', commentRoutes)
  .route('/api/chat', chatRoutes)
  .route('/api/cursors', cursorRoutes)
  .route('/api/github', githubRoutes)

export type AppType = typeof app
export default app
```

#### 2.2 Route Migration Map

| Meteor Method | Hono Route | HTTP Method |
|---------------|------------|-------------|
| `sessions.create` | `/api/sessions` | POST |
| `sessions.update` | `/api/sessions/:id` | PATCH |
| `sessions.delete` | `/api/sessions/:id` | DELETE |
| `sessions.startReview` | `/api/sessions/:id/review/start` | POST |
| `sessions.submitReview` | `/api/sessions/:id/review/submit` | POST |
| `files.add` | `/api/sessions/:sessionId/files` | POST |
| `files.markReviewed` | `/api/files/:id/reviewed` | POST |
| `comments.add` | `/api/files/:fileId/comments` | POST |
| `comments.resolve` | `/api/comments/:id/resolve` | POST |
| `chat.send` | `/api/sessions/:sessionId/chat` | POST |
| `github.importPR` | `/api/github/import` | POST |
| `github.validatePRUrl` | `/api/github/validate` | POST |

#### 2.3 Example Route with Zod Validation

```typescript
// packages/api/src/routes/sessions.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'

const createSessionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
  source: z.object({
    type: z.enum(['manual', 'github']),
    url: z.string().url().optional(),
  }),
})

export const sessionRoutes = new Hono()
  .use('*', authMiddleware)
  .post(
    '/',
    zValidator('json', createSessionSchema),
    async (c) => {
      const data = c.req.valid('json')
      const userId = c.get('userId')

      const session = await createSession(userId, data)
      return c.json({ session }, 201)
    }
  )
  .get('/:id', async (c) => {
    const { id } = c.req.param()
    const session = await getSession(id)
    if (!session) {
      return c.json({ error: 'Not found' }, 404)
    }
    return c.json({ session }, 200)
  })
```

#### 2.4 WebSocket for Real-time Features

```typescript
// packages/api/src/ws/cursors.ts
import { Hono } from 'hono'
import { upgradeWebSocket } from 'hono/bun'

export const cursorWS = new Hono().get(
  '/ws/sessions/:sessionId/cursors',
  upgradeWebSocket((c) => {
    const sessionId = c.req.param('sessionId')

    return {
      onOpen(event, ws) {
        // Join session room (use Redis pub/sub for scaling)
        console.log(`User joined cursor channel: ${sessionId}`)
      },
      onMessage(event, ws) {
        // Broadcast cursor position to other users
        const data = JSON.parse(event.data as string)
        // ws.send(JSON.stringify({ type: 'cursor', ...data }))
      },
      onClose() {
        console.log('User left cursor channel')
      },
    }
  })
)
```

---

### Phase 3: Frontend Migration (Hono JSX-DOM SPA)

#### 3.1 Entry Point

```tsx
// packages/client/src/index.tsx
import { render } from 'hono/jsx/dom'
import { App } from './App'

const root = document.getElementById('root')
if (root) {
  render(<App />, root)
}
```

#### 3.2 Hono RPC Client Setup

```typescript
// packages/client/src/api/client.ts
import { hc } from 'hono/client'
import type { AppType } from '@codesync/api'

export const api = hc<AppType>('/', {
  init: {
    credentials: 'include', // Send cookies with requests
  },
})

// Type-safe API calls:
// const res = await api.sessions.$post({ json: { title: 'My Session' } })
// const data = await res.json()
```

#### 3.3 Client-Side Routing (Simple SPA Router)

```tsx
// packages/client/src/router.tsx
import { useState, useEffect } from 'hono/jsx'

export function Router() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Route matching
  if (path === '/') return <Home />
  if (path === '/login') return <Login />
  if (path === '/dashboard') return <Dashboard />
  if (path.startsWith('/session/')) {
    const sessionId = path.split('/')[2]
    return <Session sessionId={sessionId} />
  }
  return <NotFound />
}

export function navigate(to: string) {
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
```

#### 3.4 Auth Hook with JWT

```tsx
// packages/client/src/hooks/useAuth.ts
import { useState, useEffect } from 'hono/jsx'
import { api } from '../api/client'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.auth.me.$get()
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.auth.login.$post({ json: { email, password } })
    if (res.ok) {
      const data = await res.json()
      setUser(data.user)
      return { success: true }
    }
    return { success: false, error: (await res.json()).error }
  }

  const logout = async () => {
    await api.auth.logout.$post()
    setUser(null)
  }

  return { user, loading, login, logout }
}
```

#### 3.5 WebSocket Hook for Real-time

```tsx
// packages/client/src/hooks/useWebSocket.ts
import { useState, useEffect, useRef } from 'hono/jsx'

export function useWebSocket<T>(url: string) {
  const [messages, setMessages] = useState<T[]>([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setMessages((prev) => [...prev, data])
    }

    return () => ws.close()
  }, [url])

  const send = (data: unknown) => {
    wsRef.current?.send(JSON.stringify(data))
  }

  return { messages, connected, send }
}
```

---

### Phase 4: Database Migration

#### 4.1 Schema (Drizzle ORM with PostgreSQL)

```typescript
// packages/api/src/db/schema.ts
import { pgTable, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash'),
  name: text('name'),
  githubId: text('github_id').unique(),
  githubUsername: text('github_username'),
  githubAccessToken: text('github_access_token'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  title: text('title').notNull(),
  description: text('description'),
  createdBy: text('created_by').references(() => users.id),
  isPublic: boolean('is_public').default(false),
  shareToken: text('share_token'),
  status: text('status').default('draft'), // draft, in_review, approved, merged
  source: jsonb('source'), // { type, url, repository, prNumber, branch, commit }
  settings: jsonb('settings'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const files = pgTable('files', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  sessionId: text('session_id').references(() => sessions.id),
  path: text('path').notNull(),
  name: text('name').notNull(),
  content: text('content'),
  originalContent: text('original_content'),
  language: text('language'),
  isDeleted: boolean('is_deleted').default(false),
  isAdded: boolean('is_added').default(false),
  isModified: boolean('is_modified').default(false),
  isReviewed: boolean('is_reviewed').default(false),
  hunks: jsonb('hunks'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const comments = pgTable('comments', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  sessionId: text('session_id').references(() => sessions.id),
  fileId: text('file_id').references(() => files.id),
  authorId: text('author_id').references(() => users.id),
  lineNumber: integer('line_number'),
  text: text('text').notNull(),
  parentId: text('parent_id'),
  threadId: text('thread_id'),
  isResolved: boolean('is_resolved').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

export const chatMessages = pgTable('chat_messages', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  sessionId: text('session_id').references(() => sessions.id),
  authorId: text('author_id').references(() => users.id),
  text: text('text').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})
```

---

### Phase 5: Migration Steps (Execution Order)

1. **Week 1: Setup** ✅ COMPLETE
   - [x] Create monorepo structure with pnpm workspaces
   - [x] Setup PostgreSQL + Drizzle ORM
   - [x] Create basic Hono API skeleton
   - [x] Setup Bun for development

2. **Week 2: Auth & Core API** ✅ COMPLETE
   - [x] Implement JWT auth (login, register)
   - [ ] OAuth GitHub (pending)
   - [x] Migrate sessions CRUD
   - [x] Migrate files CRUD
   - [x] Migrate comments CRUD
   - [x] Migrate chat messages
   - [x] Setup Zod validation schemas

3. **Week 3: Real-time & Advanced Features** 🟡 IN PROGRESS
   - [x] Implement WebSocket for cursors (basic handler)
   - [ ] Implement WebSocket for chat (broadcast)
   - [ ] Implement WebSocket for presence
   - [ ] Redis pub/sub for scaling

4. **Week 4: Frontend Migration** ✅ COMPLETE
   - [x] Setup Hono JSX-DOM client (packages/client)
   - [x] Migrate core components (keep Tailwind classes)
   - [x] Setup API client with JWT auth
   - [x] Implement client-side routing
   - [x] Pages: Home, Login, Dashboard, Session
   - [x] Features: Auth, Sessions, Files, Comments

5. **Week 5: GitHub Integration & Testing**
   - [ ] Migrate GitHub OAuth flow
   - [ ] Migrate PR import functionality
   - [ ] E2E tests with Playwright
   - [ ] Load testing

6. **Week 6: Polish & Deploy**
   - [ ] Data migration scripts (MongoDB → PostgreSQL)
   - [ ] Deploy to Cloudflare Workers / Bun server
   - [ ] Setup CI/CD
   - [ ] Documentation

---

### Key Differences: Meteor vs Hono

| Feature | Meteor | Hono |
|---------|--------|------|
| Data fetching | `Meteor.subscribe()` | `hc<AppType>()` RPC client |
| Mutations | `Meteor.call()` | REST endpoints via RPC |
| Real-time | DDP (built-in) | WebSocket + Redis pub/sub |
| Auth | `accounts-base` | JWT + cookies |
| Database | MongoDB | PostgreSQL + Drizzle |
| Types | Manual | Full type inference via RPC |
| Bundle size | ~100KB+ | ~3KB (hono/jsx/dom) |

---

## Current Tech Stack (Meteor - Legacy)

- **Framework**: Meteor 3.x
- **Frontend**: React 19 + Tailwind CSS 3
- **Bundler**: Rspack
- **Database**: MongoDB
- **Real-time**: Meteor DDP

## Target Tech Stack (Hono)

- **Runtime**: Bun
- **Backend**: Hono + Drizzle ORM + PostgreSQL
- **Frontend**: Hono JSX-DOM (Client Components)
- **Real-time**: Hono WebSocket + Redis
- **Auth**: JWT
- **Validation**: Zod (shared)
- **Styling**: Tailwind CSS 3

---

## Commands (After Migration)

```bash
# Development
bun run dev              # Start both API and client
bun run dev:api          # Start API only
bun run dev:client       # Start client only

# Database
bun run db:migrate       # Run migrations
bun run db:generate      # Generate Drizzle migrations
bun run db:studio        # Open Drizzle Studio

# Build & Deploy
bun run build            # Build all packages
bun run typecheck        # TypeScript check
bun run lint             # Lint
bun run test             # Run tests
```
