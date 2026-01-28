/**
 * GitHub Review Sync Routes
 * POST /sessions/:id/submit-review - Submit review to GitHub PR
 */

import { and, eq, isNull } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../../db/client';
import { comments, files, sessions, users } from '../../db/schema';
import { type AuthVariables, authMiddleware } from '../../middleware/auth';
import {
  type GitHubReviewEvent,
  isPROpen,
  mapLineToDiffPosition,
  type ReviewComment,
  submitGitHubReview,
} from '../../services/github';

export const syncRoutes = new Hono<{ Variables: AuthVariables }>()
  /**
   * POST /sessions/:id/submit-review
   * Submit a CodeSync review to the GitHub PR
   */
  .post('/sessions/:id/submit-review', authMiddleware, async (c) => {
    const { id } = c.req.param();
    const userId = c.get('userId');

    // 1. Get session with GitHub source info
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, id),
    });

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Verify ownership
    if (session.createdBy !== userId) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    // Check if session is from GitHub
    if (session.source?.type !== 'github') {
      return c.json({ error: 'Session was not imported from GitHub' }, 400);
    }

    // 2. Get user's GitHub token
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user?.githubAccessToken) {
      return c.json({ error: 'GitHub not connected. Please connect your GitHub account.' }, 400);
    }

    // 3. Validate session status
    if (session.status === 'draft') {
      return c.json({ error: 'Start review before submitting to GitHub' }, 400);
    }

    // 4. Extract GitHub info from source
    const { repository, prNumber, commit } = session.source;
    if (!repository || !prNumber || !commit) {
      return c.json({ error: 'Missing GitHub PR information' }, 400);
    }

    const [owner, repo] = repository.split('/');
    if (!owner || !repo) {
      return c.json({ error: 'Invalid repository format' }, 400);
    }

    // 5. Check if PR is still open
    try {
      const prStatus = await isPROpen(user.githubAccessToken, owner, repo, prNumber);
      if (prStatus.merged) {
        return c.json({ error: 'PR has already been merged' }, 400);
      }
      if (!prStatus.open) {
        return c.json({ error: `PR is ${prStatus.state}` }, 400);
      }
    } catch (error) {
      console.error('Failed to check PR status:', error);
      // Continue anyway - let GitHub API return the actual error
    }

    // 6. Get unsynced comments (not resolved, not already synced)
    const unsyncedComments = await db.query.comments.findMany({
      where: and(
        eq(comments.sessionId, id),
        eq(comments.isResolved, false),
        isNull(comments.syncedAt)
      ),
      with: {
        author: true,
      },
    });

    // 7. Get files for diff mapping
    const sessionFiles = await db.query.files.findMany({
      where: eq(files.sessionId, id),
    });

    const filesById = new Map(sessionFiles.map((f) => [f.id, f]));

    // 8. Map comments to GitHub format
    const reviewComments: ReviewComment[] = [];
    const commentErrors: Array<{ commentId: string; error: string }> = [];

    for (const comment of unsyncedComments) {
      const file = filesById.get(comment.fileId);
      if (!file) {
        commentErrors.push({ commentId: comment.id, error: 'File not found' });
        continue;
      }

      if (!comment.lineNumber) {
        // General file comment without line number - skip for now
        // GitHub doesn't support file-level comments in PR reviews
        commentErrors.push({ commentId: comment.id, error: 'No line number' });
        continue;
      }

      // Map line number to diff position
      const position = mapLineToDiffPosition(file.hunks, comment.lineNumber, 'new');

      if (!position) {
        commentErrors.push({
          commentId: comment.id,
          error: `Line ${comment.lineNumber} not in diff`,
        });
        continue;
      }

      // Format comment with author attribution
      const authorName = comment.author?.name || comment.author?.email || 'CodeSync User';
      const body = `**${authorName}** commented:\n\n${comment.text}`;

      reviewComments.push({
        path: file.path,
        position: position.position,
        side: position.side,
        body,
      });
    }

    // 9. Determine review event based on session status
    let event: GitHubReviewEvent = 'COMMENT';
    if (session.status === 'approved') {
      event = 'APPROVE';
    }
    // Note: REQUEST_CHANGES could be added as a separate action

    // 10. Build review body
    let reviewBody = '';
    if (session.status === 'approved') {
      reviewBody = '✅ Approved via [CodeSync](https://codesync.dev)';
    } else if (session.status === 'merged') {
      reviewBody = 'Review submitted via [CodeSync](https://codesync.dev)';
    } else {
      reviewBody = 'Review submitted via [CodeSync](https://codesync.dev)';
    }

    // Add summary of skipped comments if any
    if (commentErrors.length > 0) {
      reviewBody +=
        `\n\n_Note: ${commentErrors.length} comment(s) could not be synced ` +
        `(line not in diff or no line number)._`;
    }

    // 11. Submit to GitHub
    try {
      const result = await submitGitHubReview({
        accessToken: user.githubAccessToken,
        owner,
        repo,
        prNumber,
        commitSha: commit,
        event,
        body: reviewBody,
        comments: reviewComments,
      });

      // 12. Mark comments as synced
      const syncedAt = new Date();
      const syncedCommentIds = unsyncedComments
        .filter((c) => !commentErrors.find((e) => e.commentId === c.id))
        .map((c) => c.id);

      if (syncedCommentIds.length > 0) {
        await db
          .update(comments)
          .set({ syncedAt })
          .where(
            and(
              eq(comments.sessionId, id)
              // Using raw SQL for IN clause since drizzle-orm doesn't have a direct inArray for update
              // We'll update each comment individually instead
            )
          );

        // Update each synced comment
        for (const commentId of syncedCommentIds) {
          await db
            .update(comments)
            .set({ syncedAt, githubCommentId: String(result.reviewId) })
            .where(eq(comments.id, commentId));
        }
      }

      // 13. Update session with review info
      await db
        .update(sessions)
        .set({
          githubReviewId: String(result.reviewId),
          githubSyncedAt: syncedAt,
          updatedAt: new Date(),
        })
        .where(eq(sessions.id, id));

      return c.json({
        success: true,
        reviewId: result.reviewId,
        reviewUrl: result.reviewUrl,
        reviewState: result.state,
        commentsSynced: syncedCommentIds.length,
        commentsSkipped: commentErrors.length,
        skippedReasons: commentErrors,
      });
    } catch (error: unknown) {
      console.error('Failed to submit review to GitHub:', error);

      // Handle specific GitHub API errors
      if (error instanceof Error) {
        const message = error.message.toLowerCase();

        if (message.includes('401') || message.includes('bad credentials')) {
          return c.json(
            { error: 'GitHub token expired. Please reconnect your GitHub account.' },
            401
          );
        }

        if (message.includes('403') || message.includes('forbidden')) {
          return c.json({ error: 'You do not have write access to this repository.' }, 403);
        }

        if (message.includes('404') || message.includes('not found')) {
          return c.json({ error: 'Pull request not found. It may have been deleted.' }, 404);
        }

        if (message.includes('422') || message.includes('unprocessable')) {
          return c.json(
            { error: 'Invalid review data. Some comments may reference lines not in the diff.' },
            422
          );
        }

        if (message.includes('rate limit')) {
          return c.json({ error: 'GitHub rate limit exceeded. Please try again later.' }, 429);
        }
      }

      return c.json({ error: 'Failed to submit review to GitHub. Please try again.' }, 500);
    }
  })

  /**
   * GET /sessions/:id/sync-status
   * Get the sync status for a session
   */
  .get('/sessions/:id/sync-status', authMiddleware, async (c) => {
    const { id } = c.req.param();
    const userId = c.get('userId');

    // Get session
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, id),
    });

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Check authorization
    if (session.createdBy !== userId) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    // Count synced vs unsynced comments
    const allComments = await db.query.comments.findMany({
      where: eq(comments.sessionId, id),
    });

    const syncedCount = allComments.filter((c) => c.syncedAt).length;
    const unsyncedCount = allComments.filter((c) => !c.syncedAt && !c.isResolved).length;

    return c.json({
      isGitHubSession: session.source?.type === 'github',
      githubReviewId: session.githubReviewId,
      lastSyncedAt: session.githubSyncedAt,
      totalComments: allComments.length,
      syncedComments: syncedCount,
      unsyncedComments: unsyncedCount,
      canSync: session.source?.type === 'github' && session.status !== 'draft',
    });
  });
