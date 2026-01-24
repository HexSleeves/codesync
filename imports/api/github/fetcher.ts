import { Octokit } from '@octokit/rest';
import { Hunk } from '../files/files';
import { GitHubPRData, GitHubPRFile } from './types';

// Type guard for errors with HTTP status
function isErrorWithStatus(error: unknown): error is { status: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  );
}

/**
 * Fetch PR details from GitHub
 */
export async function fetchPRDetails(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<GitHubPRData> {
  const { data } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber
  });

  return {
    title: data.title,
    body: data.body,
    head: {
      ref: data.head.ref,
      sha: data.head.sha
    },
    base: {
      ref: data.base.ref,
      sha: data.base.sha
    },
    user: {
      login: data.user?.login || 'unknown'
    },
    html_url: data.html_url,
    state: data.state
  };
}

/**
 * Fetch PR files (diff) from GitHub
 */
export async function fetchPRFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<GitHubPRFile[]> {
  const files: GitHubPRFile[] = [];
  let page = 1;
  const perPage = 100;

  // GitHub API paginates PR files, so we need to fetch all pages
  while (true) {
    const { data } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: perPage,
      page
    });

    for (const file of data) {
      files.push({
        filename: file.filename,
        status: file.status ,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
        previous_filename: file.previous_filename || undefined,
        sha: file.sha || '',
        blob_url: file.blob_url,
        raw_url: file.raw_url,
        contents_url: file.contents_url
      });
    }

    if (data.length < perPage) break;
    page++;
  }

  return files;
}

/**
 * Fetch file content from GitHub
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
      ref
    });

    if ('content' in data && data.content) {
      // GitHub returns base64 encoded content
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return null;
  } catch (error: unknown) {
    // File doesn't exist at this ref (might be a new file)
    if (isErrorWithStatus(error) && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Reconstruct file content from base content and patch
 */
export function applyPatch(baseContent: string | null, hunks: Hunk[]): string {
  if (!baseContent || hunks.length === 0) {
    // If no base content, this is a new file - reconstruct from hunks
    if (hunks.length > 0) {
      const lines: string[] = [];
      for (const hunk of hunks) {
        for (const line of hunk.lines) {
          if (line.type === 'add' || line.type === 'context') {
            lines.push(line.content);
          }
        }
      }
      return lines.join('\n');
    }
    return '';
  }

  // For modified files, we already fetch the new content directly
  // This function is mainly for fallback reconstruction
  return baseContent;
}
