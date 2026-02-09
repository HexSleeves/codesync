/**
 * GitHub PR Import Routes
 * Handles PR validation and import into review sessions
 */

import { importPRSchema, validatePRUrlSchema } from '@codesync/shared';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { db } from '../../db/client';
import { sessionParticipants, sessions, users } from '../../db/schema';
import { type AuthVariables, authMiddleware } from '../../middleware/auth';
import { getPullRequests, getRepositories } from '../../services';
import { processPRFiles } from '../../services/github/file-processor';
import {
  createOctokit,
  fetchPRDetails,
  fetchPRFiles,
  getGitHubErrorStatus,
  getGitHubToken,
} from '../../services/github/pr-fetcher';
import { parseGitHubPRUrl } from '../../utils/github-parser';

export const importRoutes = new Hono<{ Variables: AuthVariables }>()
  /**
   * POST /validate
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

    // Return basic info without fetching if no token
    if (!token) {
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
      const octokit = createOctokit(token);
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
          author: prData.author,
          branch: prData.head.ref,
          url: prData.url,
        },
        needsAuth: false,
      });
    } catch (error: unknown) {
      const status = getGitHubErrorStatus(error);

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

      console.error('GitHub validation error:', error);
      return c.json({ error: 'Failed to validate PR URL' }, 500);
    }
  })

  .get('/repositories', authMiddleware, async (c) => {
    const userId = c.get('userId');

    const token = await getGitHubToken(userId);
    if (!token) {
      return c.json({ error: 'GitHub authentication required' }, 401);
    }

    // Get GitHub username from user record
    const user = await db
      .select({ githubUsername: users.githubUsername })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user?.githubUsername) {
      return c.json({ error: 'GitHub account not connected' }, 400);
    }

    try {
      const octokit = createOctokit(token);
      const repositories = await getRepositories(octokit, user.githubUsername);
      return c.json({ repositories });
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
      return c.json({ error: 'Failed to fetch repositories' }, 500);
    }
  })

  .get('/repositories/:owner/:repo/pulls', authMiddleware, async (c) => {
    const userId = c.get('userId');
    const { owner, repo } = c.req.param();

    const token = await getGitHubToken(userId);
    if (!token) {
      return c.json({ error: 'GitHub authentication required' }, 401);
    }

    try {
      const octokit = createOctokit(token);
      const pullRequests = await getPullRequests(octokit, owner, repo);
      return c.json({ pullRequests });
    } catch (error) {
      console.error('Failed to fetch pull requests:', error);
      return c.json({ error: 'Failed to fetch pull requests' }, 500);
    }
  })

  /**
   * POST /import
   * Import a GitHub PR into a new review session
   */
  .post('/import', authMiddleware, zValidator('json', importPRSchema), async (c) => {
    const { prUrl } = c.req.valid('json');
    const userId = c.get('userId');
    let createdSessionId: string | null = null;

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

    const octokit = createOctokit(token);

    try {
      // Fetch PR details
      const prData = await fetchPRDetails(octokit, prInfo.owner, prInfo.repo, prInfo.prNumber);

      // Create session
      const sessionId = nanoid();
      const shareToken = nanoid(12);
      createdSessionId = sessionId;

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
          url: prData.url,
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
      const fileProcessing = await processPRFiles(octokit, sessionId, prFiles, {
        owner: prInfo.owner,
        repo: prInfo.repo,
        baseSha: prData.base.sha,
        headSha: prData.head.sha,
      });

      if (fileProcessing.failedCount > 0) {
        throw new Error(
          `Failed to process ${fileProcessing.failedCount} file(s): ${fileProcessing.failedFiles.join(', ')}`
        );
      }

      return c.json(
        {
          success: true,
          session: {
            id: sessionId,
            title: prData.title,
            shareToken,
            fileCount: fileProcessing.processedCount,
          },
          message: `Imported ${fileProcessing.processedCount} files from PR #${prInfo.prNumber}`,
        },
        201
      );
    } catch (error: unknown) {
      if (createdSessionId) {
        try {
          await db.delete(sessions).where(eq(sessions.id, createdSessionId));
        } catch (cleanupError) {
          console.error('Failed to clean up partially imported session:', cleanupError);
        }
      }

      const status = getGitHubErrorStatus(error);

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

      console.error('GitHub import error:', error);
      return c.json({ error: 'Failed to import PR' }, 500);
    }
  });
