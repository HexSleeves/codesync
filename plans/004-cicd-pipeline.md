# Plan 004: CI/CD Pipeline with GitHub Actions

**Status:** 🟡 Planned  
**Priority:** High  
**Estimated Effort:** 1-2 hours  
**Created:** Jan 28, 2026  

---

## Executive Summary

Set up a GitHub Actions CI/CD pipeline for CodeSync that:
1. Runs type checking and linting on every PR
2. Builds the project to verify no build errors
3. (Optional) Runs E2E tests
4. (Optional) Auto-deploys on merge to main

---

## Success Criteria

- [ ] PRs are blocked if TypeScript has errors
- [ ] PRs are blocked if linting fails
- [ ] Build is verified on every PR
- [ ] Pipeline runs in under 5 minutes
- [ ] Clear error messages on failure

---

## Implementation Plan

### Phase 1: Basic CI Workflow (30 min)

#### 1.1 Create GitHub Actions Workflow

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, new]
  pull_request:
    branches: [main, new]

jobs:
  check:
    name: Type Check & Lint
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Type check (API)
        run: cd packages/api && bun tsc --noEmit

      - name: Type check (Client)
        run: cd packages/client && bun tsc --noEmit

      - name: Type check (Shared)
        run: cd packages/shared && bun tsc --noEmit

      - name: Lint
        run: bun run lint

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: check
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Build client
        run: cd packages/client && bun run build

      - name: Build API (verify compilation)
        run: cd packages/api && bun build src/index.ts --outdir=dist --target=bun
```

#### 1.2 Create package.json scripts (if missing)

**File:** `packages/client/package.json` - ensure build script exists:
```json
{
  "scripts": {
    "build": "vite build",
    "dev": "vite",
    "preview": "vite preview"
  }
}
```

---

### Phase 2: Caching for Speed (15 min)

#### 2.1 Add Bun cache

Update `.github/workflows/ci.yml`:

```yaml
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Cache Bun dependencies
        uses: actions/cache@v4
        with:
          path: ~/.bun/install/cache
          key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}
          restore-keys: |
            ${{ runner.os }}-bun-
```

---

### Phase 3: E2E Tests (Optional, 1 hour)

#### 3.1 Add Playwright test job

```yaml
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: build
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: codesync
          POSTGRES_PASSWORD: codesync
          POSTGRES_DB: codesync
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Install Playwright browsers
        run: bunx playwright install --with-deps chromium

      - name: Run migrations
        run: cd packages/api && bun run db:migrate
        env:
          DATABASE_URL: postgres://codesync:codesync@localhost:5432/codesync

      - name: Start API server
        run: |
          cd packages/api && bun src/index.ts &
          sleep 5
        env:
          DATABASE_URL: postgres://codesync:codesync@localhost:5432/codesync
          JWT_SECRET: test-secret
          PASSWORD_SALT: test-salt

      - name: Start client
        run: |
          cd packages/client && bun run preview &
          sleep 3

      - name: Run E2E tests
        run: bunx playwright test
        env:
          BASE_URL: http://localhost:4173

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

### Phase 4: Auto-Deploy (Optional, 30 min)

#### 4.1 Deploy on merge to main

Add deployment job that runs only on main branch:

```yaml
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: [check, build]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /home/exedev/codesync
            git pull origin main
            bun install
            cd packages/client && bun run build
            sudo systemctl restart codesync-api
            sudo systemctl restart codesync-client
```

---

## File Changes Summary

### New Files

| File | Purpose |
|------|--------|
| `.github/workflows/ci.yml` | Main CI workflow |
| `playwright.config.ts` | E2E test configuration (if adding tests) |
| `tests/e2e/basic.spec.ts` | Basic E2E test (if adding tests) |

### Modified Files

| File | Changes |
|------|--------|
| `package.json` | Add CI-related scripts if needed |
| `packages/client/package.json` | Ensure build script exists |

---

## GitHub Secrets Required (for deploy)

| Secret | Description |
|--------|-------------|
| `DEPLOY_HOST` | Server hostname/IP |
| `DEPLOY_USER` | SSH username |
| `DEPLOY_SSH_KEY` | SSH private key |

---

## Testing the Pipeline

1. Create workflow file
2. Push to a feature branch
3. Open PR to main
4. Verify checks run and pass
5. Intentionally break TypeScript, verify it fails
6. Fix and merge

---

## Estimated Timeline

| Phase | Time | Description |
|-------|------|-------------|
| Phase 1 | 30 min | Basic CI workflow |
| Phase 2 | 15 min | Add caching |
| Phase 3 | 1 hour | E2E tests (optional) |
| Phase 4 | 30 min | Auto-deploy (optional) |

**Minimum viable CI: 45 minutes** (Phases 1 + 2)

---

## Implementation Order

1. **Create `.github/workflows/ci.yml`** with basic checks
2. **Test on a branch** - push and verify workflow runs
3. **Add caching** - speed up subsequent runs
4. **Configure branch protection** - require checks to pass
5. **(Optional) Add E2E tests** - requires Playwright setup
6. **(Optional) Add auto-deploy** - requires server secrets

---

## Notes

- Bun is fast, so CI should complete in 2-3 minutes without E2E
- GitHub Actions is free for public repos, 2000 min/month for private
- Can add status badges to README once workflow is set up
- Consider adding Dependabot for dependency updates
