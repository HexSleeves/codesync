/**
 * GitHub Review Sync Service
 * Handles submitting CodeSync reviews to GitHub PRs
 */

import { createOctokit } from './pr-fetcher';

export type GitHubReviewEvent = 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';

export interface ReviewComment {
  /** File path relative to repository root */
  path: string;
  /** Position in the diff (not line number) */
  position?: number;
  /** Line number in the file (for multi-line comments) */
  line?: number;
  /** Which side of the diff: LEFT = old, RIGHT = new */
  side?: 'LEFT' | 'RIGHT';
  /** Comment body text */
  body: string;
}

export interface SubmitReviewParams {
  /** User's GitHub access token */
  accessToken: string;
  /** Repository owner (user or org) */
  owner: string;
  /** Repository name */
  repo: string;
  /** Pull request number */
  prNumber: number;
  /** Commit SHA to attach comments to */
  commitSha: string;
  /** Review action: APPROVE, REQUEST_CHANGES, or COMMENT */
  event: GitHubReviewEvent;
  /** Overall review body text (optional) */
  body?: string;
  /** Individual line comments */
  comments: ReviewComment[];
}

export interface SubmitReviewResult {
  /** GitHub review ID */
  reviewId: number;
  /** URL to the review on GitHub */
  reviewUrl: string;
  /** Node ID for GraphQL */
  nodeId: string;
  /** Review state */
  state: string;
}

/**
 * Submit a review to a GitHub PR
 *
 * Uses the GitHub REST API to create a review with comments.
 * Comments are attached to specific lines in the diff.
 */
export async function submitGitHubReview(params: SubmitReviewParams): Promise<SubmitReviewResult> {
  const { accessToken, owner, repo, prNumber, commitSha, event, body, comments } = params;

  const octokit = createOctokit(accessToken);

  // Filter out comments without valid positions
  const validComments = comments.filter((c) => c.position !== undefined);

  // Create the review with comments
  // Note: pulls.createReview only supports `position` (diff-relative), not `line`/`side`
  const { data: review } = await octokit.pulls.createReview({
    owner,
    repo,
    pull_number: prNumber,
    commit_id: commitSha,
    event,
    body: body || undefined,
    comments: validComments.map((c) => ({
      path: c.path,
      position: c.position!,
      body: c.body,
    })),
  });

  return {
    reviewId: review.id,
    reviewUrl: review.html_url,
    nodeId: review.node_id,
    state: review.state,
  };
}

/**
 * Check if a PR is still open
 */
export async function isPROpen(
  accessToken: string,
  owner: string,
  repo: string,
  prNumber: number
): Promise<{ open: boolean; state: string; merged: boolean }> {
  const { createOctokit } = await import('./pr-fetcher');
  const octokit = createOctokit(accessToken);

  const { data: pr } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  return {
    open: pr.state === 'open',
    state: pr.state,
    merged: pr.merged,
  };
}
