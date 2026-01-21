# CodeSync

Real-time collaborative code editing app built with Meteor.

## Tech Stack

- **Framework**: Meteor 3.x
- **Frontend**: React 19 + Tailwind CSS 3
- **Bundler**: Rspack (not Webpack)
- **Database**: MongoDB (Meteor's default)
- **Real-time**: Meteor's DDP protocol (built-in)

## Project Structure

```
client/main.tsx      # Client entry
server/main.ts       # Server entry
imports/
  api/               # Collections, methods, publications
    chat/            # Chat functionality
    comments/        # Code comments
    cursors/         # Collaborative cursors
    files/           # File management
    github/          # GitHub integration
    sessions/        # User sessions
    users/           # User management
  ui/                # React components
    components/      # Reusable UI
    pages/           # Route pages
    hooks/           # Custom hooks
```

## Commands

```bash
meteor run           # Dev server (or: bun run dev)
meteor build         # Production build
bun run typecheck    # TypeScript check
bun run lint         # Lint
```

## Conventions

- Use Meteor methods for mutations: `Meteor.callAsync('method.name', args)`
- Use publications for data: `Meteor.subscribe('publication.name')`
- Collections in `imports/api/<feature>/collection.ts`
- Methods in `imports/api/<feature>/methods.ts`
- Publications in `imports/api/<feature>/publications.ts`

## Key Features

- Real-time collaborative editing
- GitHub integration via `@octokit/rest`
- Syntax highlighting with Prism.js
- Diff viewing with `diff` package

## Notes

- Meteor handles hot reload automatically
- MongoDB runs embedded in dev mode
- Uses Rspack for faster builds (configured in `rspack.config.js`)
