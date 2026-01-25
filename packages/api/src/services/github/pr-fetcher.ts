/**
 * GitHub PR Fetcher Service
 * Handles fetching PR data from GitHub API
 */

import { Octokit } from '@octokit/rest';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { users } from '../../db/schema';

/**
 * GitHub PR file from API
 */
export interface GitHubPRFile {
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
 * Normalized PR details
 */
export interface PRDetails {
  title: string;
  body: string | null;
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
  author: string;
  url: string;
  state: string;
}

/**
 * Get user's GitHub access token from database
 */
export async function getGitHubToken(userId: string): Promise<string | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { githubAccessToken: true },
  });
  return user?.githubAccessToken ?? null;
}

/**
 * Create an authenticated Octokit instance
 */
export function createOctokit(token: string): Octokit {
  return new Octokit({ auth: token });
}

/**
 * Fetch PR details from GitHub
 */
export async function fetchPRDetails(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<PRDetails> {
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
    author: data.user?.login || 'unknown',
    url: data.html_url,
    state: data.state,
  };
}

/**
 * Fetch PR files from GitHub (with pagination)
 */
export async function fetchPRFiles(
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
 * Fetch file content from GitHub at a specific ref
 */
export async function fetchFileContent(
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
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return null;
  } catch (error: unknown) {
    // File doesn't exist at this ref (e.g., new file)
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Check if error is a GitHub API error with specific status
 */
export function isGitHubError(error: unknown, status?: number): boolean {
  if (!error || typeof error !== 'object' || !('status' in error)) {
    return false;
  }
  if (status !== undefined) {
    return (error as { status: number }).status === status;
  }
  return true;
}

/**
 * Get GitHub error status code
 */
export function getGitHubErrorStatus(error: unknown): number | null {
  if (error && typeof error === 'object' && 'status' in error) {
    return (error as { status: number }).status;
  }
  return null;
}
