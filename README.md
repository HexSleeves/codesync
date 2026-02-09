# CodeSync

> Real-time collaborative code review platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Hono](https://img.shields.io/badge/Hono-4.11-orange.svg)](https://hono.dev/)

CodeSync is a modern code review application that enables teams to collaborate on code changes in real-time. Import pull requests directly from GitHub, add inline comments, and review code together with live cursor tracking and chat.

![CodeSync Home](docs/screenshots/home.png)

## Features

### ✅ Implemented

- **GitHub Integration** - Import pull requests with one click, OAuth authentication
- **Diff Viewer** - Side-by-side and unified diff views with syntax highlighting (25+ languages)
- **Inline Comments** - Add comments on specific lines, threaded discussions, resolve/unresolve
- **Session Management** - Create, edit, delete review sessions with status tracking
- **File Tree** - Navigate files easily, track reviewed status
- **Dark Theme** - Beautiful dark UI built with shadcn/ui components

### 🚧 In Progress

- **Real-time Collaboration** - Live cursor positions, presence indicators
- **Chat** - Session chat with real-time updates
- **User Presence** - See who's online in your session

### 📋 Planned

- Keyboard shortcuts
- Share sessions via link
- Email notifications
- Review approval workflow

## Screenshots

<details>
<summary>Click to view screenshots</summary>

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Code Review Session
![Session](docs/screenshots/session-diff.png)

### Login
![Login](docs/screenshots/login.png)

</details>

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | [Bun](https://bun.sh) 1.3+ |
| **Backend** | [Hono](https://hono.dev) - Ultrafast web framework |
| **Frontend** | [Hono JSX-DOM](https://hono.dev/docs/guides/jsx-dom) - Client components |
| **Database** | PostgreSQL 16 + [Drizzle ORM](https://orm.drizzle.team) |
| **Validation** | [Zod](https://zod.dev) v4 - Schema validation |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) v4 + [shadcn/ui](https://ui.shadcn.com) |
| **Auth** | JWT tokens with HTTP-only cookies |
| **Syntax Highlighting** | [Prism.js](https://prismjs.com) |

## Project Structure

```
codesync/
├── packages/
│   ├── api/                 # Hono backend
│   │   └── src/
│   │       ├── config.ts    # Environment configuration
│   │       ├── routes/      # API route handlers
│   │       │   └── github/  # OAuth + PR import
│   │       ├── services/    # Business logic
│   │       ├── middleware/  # Auth middleware
│   │       ├── db/          # Database schema & client
│   │       └── ws/          # WebSocket handlers
│   ├── client/              # Hono JSX-DOM frontend
│   │   └── src/
│   │       ├── pages/       # Page components
│   │       ├── components/  # UI components
│   │       │   ├── ui/      # shadcn components
│   │       │   └── Diff/    # Diff viewer
│   │       ├── hooks/       # React-like hooks
│   │       └── stores/      # State management
│   └── shared/              # Shared types & schemas
├── plans/                   # Implementation plans
├── docs/                    # Documentation
└── docker-compose.yml       # PostgreSQL + Redis
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) 1.3+
- [Docker](https://www.docker.com/) (for PostgreSQL)
- GitHub OAuth App (optional, for PR import)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/codesync.git
cd codesync

# Install dependencies
bun install

# Start PostgreSQL
docker compose up -d postgres

# Run database migrations
cd packages/api && bun run db:migrate

# Seed test users
cd packages/api && bun run db:seed

# Start development servers
bun run dev
```

The app will be available at:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:8001
- **Health Check**: http://localhost:8001/health

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgres://codesync:codesync@localhost:5432/codesync

# Auth
JWT_SECRET=your-secret-key-change-in-production
PASSWORD_SALT=your-password-salt

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:8001/api/github/callback

# URLs
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

## API Documentation

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create new account |
| `/api/auth/login` | POST | Login with email/password |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/me` | GET | Get current user |

### Sessions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sessions` | GET | List user's sessions |
| `/api/sessions` | POST | Create new session |
| `/api/sessions/:id` | GET | Get session with files |
| `/api/sessions/:id` | PATCH | Update session |
| `/api/sessions/:id` | DELETE | Delete session |

### Files & Comments

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sessions/:id/files` | POST | Add file to session |
| `/api/files/:id/reviewed` | POST | Mark file as reviewed |
| `/api/files/:fileId/comments` | GET | Get file comments |
| `/api/files/:fileId/comments` | POST | Add comment |
| `/api/comments/:id/resolve` | POST | Resolve comment |

### GitHub

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/github/authorize` | GET | Start OAuth flow |
| `/api/github/callback` | GET | OAuth callback |
| `/api/github/status` | GET | Check connection status |
| `/api/github/validate` | POST | Validate PR URL |
| `/api/github/import` | POST | Import PR to session |

## Development

### Scripts

```bash
# Start all services in development
bun run dev

# Start API only
cd packages/api && bun --hot src/index.ts

# Start client only
cd packages/client && bun run dev

# Type check
bun run typecheck

# Lint
bun run lint

# Format
bun run format

# Database
cd packages/api
bun run db:generate   # Generate migrations
bun run db:migrate    # Run migrations
bun run db:seed       # Seed test users
bun run db:studio     # Open Drizzle Studio
```

### Code Style

This project uses [Biome](https://biomejs.dev/) for linting and formatting:

```bash
# Check for issues
bun run lint

# Fix issues
bun run lint --apply
```

## Roadmap

See [plans/](plans/) for detailed implementation plans.

### Current Focus
- [ ] WebSocket real-time collaboration ([Plan 001](plans/001-websocket-realtime.md))

### Future
- [ ] Chat panel UI
- [ ] User presence indicators  
- [ ] Keyboard shortcuts
- [ ] Share sessions
- [ ] Email notifications
- [ ] CI/CD pipeline

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Guidelines

- Follow the existing code style (enforced by Biome)
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Keep PRs focused on a single feature/fix

### Development Setup

1. Fork and clone the repo
2. Install dependencies: `bun install`
3. Start PostgreSQL: `docker compose up -d postgres`
4. Run migrations: `cd packages/api && bun run db:migrate`
5. Start dev servers: `bun run dev`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 CodeSync

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Acknowledgments

- [Hono](https://hono.dev) - Ultrafast web framework
- [shadcn/ui](https://ui.shadcn.com) - Beautiful UI components
- [Drizzle ORM](https://orm.drizzle.team) - TypeScript ORM
- [Prism.js](https://prismjs.com) - Syntax highlighting

---

<p align="center">
  Made with ❤️ by the CodeSync team
</p>
