/**
 * GitHub API routes
 * Handles GitHub OAuth, PR import and validation
 */

import { importPRSchema, validatePRUrlSchema } from '@codesync/shared';
import { zValidator } from '@hono/zod-validator';
import { Octokit } from '@octokit/rest';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { nanoid } from 'nanoid';
import { db } from '../db/client';
import { files, sessionParticipants, sessions, users } from '../db/schema';
import { type AuthVariables, authMiddleware } from '../middleware/auth';
import { parseGitHubPRUrl, parsePatch } from '../utils/github-parser';

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const GITHUB_REDIRECT_URI =
  process.env.GITHUB_REDIRECT_URI || 'http://localhost:8001/api/github/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Language detection map
const languageMap: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  py: 'python',
  rb: 'ruby',
  java: 'java',
  go: 'go',
  rs: 'rust',
  cpp: 'cpp',
  cc: 'cpp',
  c: 'c',
  h: 'c',
  hpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  html: 'html',
  css: 'css',
  scss: 'scss',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  md: 'markdown',
  mdx: 'markdown',
  sh: 'bash',
  sql: 'sql',
  xml: 'xml',
  svg: 'xml',
};

function detectLanguage(filename: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return null;
  return languageMap[ext] || null;
}

// GitHub PR types
interface GitHubPRFile {
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  previous_filename?: string;
  sha: string;
}

/**
 * Get user's GitHub token from database
 */
async function getGitHubToken(userId: string): Promise<string | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { githubAccessToken: true },
  });
  return user?.githubAccessToken ?? null;
}

/**
 * Fetch PR details from GitHub
 */
async function fetchPRDetails(octokit: Octokit, owner: string, repo: string, prNumber: number) {
  const { data } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  return {
    title: data.title,
    body: data.body,
    head: {
      ref: data.head.ref,
      sha: data.head.sha,
    },
    base: {
      ref: data.base.ref,
      sha: data.base.sha,
    },
    user: {
      login: data.user?.login || 'unknown',
    },
    html_url: data.html_url,
    state: data.state,
  };
}

/**
 * Fetch PR files from GitHub (with pagination)
 */
async function fetchPRFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<GitHubPRFile[]> {
  const prFiles: GitHubPRFile[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: perPage,
      page,
    });

    for (const file of data) {
      prFiles.push({
        filename: file.filename,
        status: file.status as GitHubPRFile['status'],
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
        previous_filename: file.previous_filename || undefined,
        sha: file.sha || '',
      });
    }

    if (data.length < perPage) break;
    page++;
  }

  return prFiles;
}

/**
 * Fetch file content from GitHub
 */
async function fetchFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  ref: string
): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    if ('content' in data && data.content) {
      // GitHub returns base64 encoded content
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return null;
  } catch (error: unknown) {
    // File doesn't exist at this ref (might be a new file)
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Process a PR file and create database record
 */
async function processPRFile(
  octokit: Octokit,
  sessionId: string,
  prFile: GitHubPRFile,
  context: { owner: string; repo: string; baseSha: string; headSha: string }
): Promise<boolean> {
  try {
    let originalContent: string | null = null;
    let content: string | null = null;

    // Fetch original content for modified/deleted files
    if (
      prFile.status === 'removed' ||
      prFile.status === 'modified' ||
      prFile.status === 'renamed'
    ) {
      const pathToFetch = prFile.previous_filename || prFile.filename;
      originalContent = await fetchFileContent(
        octokit,
        context.owner,
        context.repo,
        pathToFetch,
        context.baseSha
      );
    }

    // Fetch new content for added/modified files
    if (
      prFile.status === 'added' ||
      prFile.status === 'modified' ||
      prFile.status === 'renamed' ||
      prFile.status === 'changed'
    ) {
      content = await fetchFileContent(
        octokit,
        context.owner,
        context.repo,
        prFile.filename,
        context.headSha
      );
    } else if (prFile.status === 'removed') {
      content = null;
    }

    // Parse the patch into hunks
    const hunks = parsePatch(prFile.patch);

    // Determine file properties
    const name = prFile.filename.split('/').pop() || prFile.filename;
    const language = detectLanguage(name);

    await db.insert(files).values({
      id: nanoid(),
      sessionId,
      path: prFile.filename,
      name,
      content,
      originalContent,
      language,
      isDeleted: prFile.status === 'removed',
      isAdded: prFile.status === 'added',
      isModified:
        prFile.status === 'modified' || prFile.status === 'changed' || prFile.status === 'renamed',
      isReviewed: false,
      hunks,
    });

    return true;
  } catch (error) {
    console.error(`Error processing file ${prFile.filename}:`, error);
    return false;
  }
}

/**
 * GitHub routes
 */
export const githubRoutes = new Hono<{ Variables: AuthVariables }>()
  /**
   * GET /api/github/authorize
   * Redirect to GitHub OAuth authorization page
   */
  .get('/authorize', authMiddleware, async (c) => {
    if (!GITHUB_CLIENT_ID) {
      return c.json({ error: 'GitHub OAuth not configured' }, 500);
    }

    const userId = c.get('userId');

    // Generate state parameter for CSRF protection
    const state = nanoid(32);

    // Store state in cookie for verification
    setCookie(c, 'github_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    // Store user ID to link after callback
    setCookie(c, 'github_oauth_user', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 60 * 10,
      path: '/',
    });

    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: GITHUB_REDIRECT_URI,
      scope: 'repo read:user user:email',
      state,
    });

    const authUrl = `https://github.com/login/oauth/authorize?${params}`;

    return c.redirect(authUrl);
  })

  /**
   * GET /api/github/callback
   * Handle GitHub OAuth callback
   */
  .get('/callback', async (c) => {
    const code = c.req.query('code');
    const state = c.req.query('state');
    const error = c.req.query('error');
    const errorDescription = c.req.query('error_description');

    // Check for OAuth errors
    if (error) {
      console.error('GitHub OAuth error:', error, errorDescription);
      return c.redirect(
        `${FRONTEND_URL}/dashboard?github_error=${encodeURIComponent(errorDescription || error)}`
      );
    }

    if (!code || !state) {
      return c.redirect(`${FRONTEND_URL}/dashboard?github_error=missing_params`);
    }

    // Verify state
    const storedState = getCookie(c, 'github_oauth_state');
    const userId = getCookie(c, 'github_oauth_user');

    if (!storedState || state !== storedState) {
      return c.redirect(`${FRONTEND_URL}/dashboard?github_error=invalid_state`);
    }

    if (!userId) {
      return c.redirect(`${FRONTEND_URL}/dashboard?github_error=session_expired`);
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: GITHUB_REDIRECT_URI,
        }),
      });

      const tokenData = (await tokenResponse.json()) as {
        access_token?: string;
        error?: string;
        error_description?: string;
      };

      if (tokenData.error || !tokenData.access_token) {
        console.error('GitHub token exchange error:', tokenData.error);
        return c.redirect(
          `${FRONTEND_URL}/dashboard?github_error=${encodeURIComponent(tokenData.error_description || tokenData.error || 'token_error')}`
        );
      }

      const accessToken = tokenData.access_token;

      // Get GitHub user info
      const octokit = new Octokit({ auth: accessToken });
      const { data: githubUser } = await octokit.users.getAuthenticated();

      // Update user with GitHub info
      await db
        .update(users)
        .set({
          githubId: String(githubUser.id),
          githubUsername: githubUser.login,
          githubAccessToken: accessToken,
        })
        .where(eq(users.id, userId));

      // Clear OAuth cookies
      setCookie(c, 'github_oauth_state', '', { maxAge: 0, path: '/' });
      setCookie(c, 'github_oauth_user', '', { maxAge: 0, path: '/' });

      // Redirect to dashboard with success
      return c.redirect(`${FRONTEND_URL}/dashboard?github_connected=true`);
    } catch (err) {
      console.error('GitHub OAuth callback error:', err);
      return c.redirect(`${FRONTEND_URL}/dashboard?github_error=server_error`);
    }
  })

  /**
   * POST /api/github/disconnect
   * Disconnect GitHub account
   */
  .post('/disconnect', authMiddleware, async (c) => {
    const userId = c.get('userId');

    await db
      .update(users)
      .set({
        githubId: null,
        githubUsername: null,
        githubAccessToken: null,
      })
      .where(eq(users.id, userId));

    return c.json({ success: true, message: 'GitHub account disconnected' });
  })

  /**
   * GET /api/github/status
   * Get GitHub connection status
   */
  .get('/status', authMiddleware, async (c) => {
    const userId = c.get('userId');

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        githubId: true,
        githubUsername: true,
      },
    });

    return c.json({
      connected: !!user?.githubId,
      username: user?.githubUsername || null,
    });
  })

  /**
   * POST /api/github/validate
   * Validate a GitHub PR URL and return PR info
   */
  .post('/validate', authMiddleware, zValidator('json', validatePRUrlSchema), async (c) => {
    const { prUrl } = c.req.valid('json');

    const prInfo = parseGitHubPRUrl(prUrl);
    if (!prInfo) {
      return c.json(
        { error: 'Invalid GitHub PR URL. Use format: https://github.com/owner/repo/pull/123' },
        400
      );
    }

    const userId = c.get('userId');
    const token = await getGitHubToken(userId);

    if (!token) {
      // Return basic info without fetching PR details
      return c.json({
        valid: true,
        prInfo: {
          owner: prInfo.owner,
          repo: prInfo.repo,
          prNumber: prInfo.prNumber,
        },
        needsAuth: true,
        message: 'GitHub authentication required to fetch PR details',
      });
    }

    try {
      const octokit = new Octokit({ auth: token });
      const prData = await fetchPRDetails(octokit, prInfo.owner, prInfo.repo, prInfo.prNumber);

      return c.json({
        valid: true,
        prInfo: {
          owner: prInfo.owner,
          repo: prInfo.repo,
          prNumber: prInfo.prNumber,
        },
        prData: {
          title: prData.title,
          body: prData.body,
          state: prData.state,
          author: prData.user.login,
          branch: prData.head.ref,
          url: prData.html_url,
        },
        needsAuth: false,
      });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status === 404) {
          return c.json({ error: 'Pull request not found or not accessible' }, 404);
        }
        if (status === 401 || status === 403) {
          return c.json({
            valid: true,
            prInfo: {
              owner: prInfo.owner,
              repo: prInfo.repo,
              prNumber: prInfo.prNumber,
            },
            needsAuth: true,
            message: 'GitHub authentication required or token expired',
          });
        }
      }
      console.error('GitHub validation error:', error);
      return c.json({ error: 'Failed to validate PR URL' }, 500);
    }
  })

  /**
   * POST /api/github/import
   * Import a GitHub PR into a new review session
   */
  .post('/import', authMiddleware, zValidator('json', importPRSchema), async (c) => {
    const { prUrl } = c.req.valid('json');
    const userId = c.get('userId');

    const prInfo = parseGitHubPRUrl(prUrl);
    if (!prInfo) {
      return c.json(
        { error: 'Invalid GitHub PR URL. Use format: https://github.com/owner/repo/pull/123' },
        400
      );
    }

    const token = await getGitHubToken(userId);
    if (!token) {
      return c.json(
        {
          error: 'GitHub authentication required',
          code: 'no-github-token',
          message: 'Please connect your GitHub account to import pull requests.',
        },
        401
      );
    }

    const octokit = new Octokit({ auth: token });

    try {
      // Fetch PR details
      const prData = await fetchPRDetails(octokit, prInfo.owner, prInfo.repo, prInfo.prNumber);

      // Create session
      const sessionId = nanoid();
      const shareToken = nanoid(12);

      await db.insert(sessions).values({
        id: sessionId,
        title: prData.title || `PR #${prInfo.prNumber}`,
        description: prData.body || '',
        createdBy: userId,
        isPublic: false,
        shareToken,
        status: 'in_review',
        source: {
          type: 'github',
          url: prData.html_url,
          repository: `${prInfo.owner}/${prInfo.repo}`,
          prNumber: prInfo.prNumber,
          branch: prData.head.ref,
          commit: prData.head.sha,
        },
        settings: {
          diffView: 'unified',
          allowComments: true,
        },
      });

      // Add creator as owner participant
      await db.insert(sessionParticipants).values({
        id: nanoid(),
        sessionId,
        userId,
        role: 'owner',
      });

      // Fetch and process PR files
      const prFiles = await fetchPRFiles(octokit, prInfo.owner, prInfo.repo, prInfo.prNumber);

      let fileCount = 0;
      for (const prFile of prFiles) {
        const success = await processPRFile(octokit, sessionId, prFile, {
          owner: prInfo.owner,
          repo: prInfo.repo,
          baseSha: prData.base.sha,
          headSha: prData.head.sha,
        });
        if (success) fileCount++;
      }

      return c.json(
        {
          success: true,
          session: {
            id: sessionId,
            title: prData.title,
            shareToken,
            fileCount,
          },
          message: `Imported ${fileCount} files from PR #${prInfo.prNumber}`,
        },
        201
      );
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status === 401) {
          return c.json(
            {
              error: 'GitHub authentication failed',
              code: 'github-auth-error',
              message: 'Please re-connect your GitHub account.',
            },
            401
          );
        }
        if (status === 403) {
          return c.json(
            {
              error: 'GitHub API rate limit exceeded',
              code: 'github-rate-limit',
              message: 'Please try again later.',
            },
            429
          );
        }
        if (status === 404) {
          return c.json(
            {
              error: 'Pull request not found',
              code: 'pr-not-found',
              message: 'Make sure the repository is accessible and the PR exists.',
            },
            404
          );
        }
      }
      console.error('GitHub import error:', error);
      return c.json({ error: 'Failed to import PR' }, 500);
    }
  });
