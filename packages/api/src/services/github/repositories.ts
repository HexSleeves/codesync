import type { Octokit } from '@octokit/rest';

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  created_at: string;
}

export async function getRepositories(
  octokit: Octokit,
  username: string
): Promise<GitHubRepository[]> {
  const { data } = await octokit.repos.listForAuthenticatedUser({
    username,
    sort: 'updated',
    per_page: 100,
  });

  return data.map((repo) => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    private: repo.private,
    html_url: repo.html_url,
    created_at: repo.created_at ?? '',
  }));
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  state: string;
  author: string;
  created_at: string;
  html_url: string;
}

export async function getPullRequests(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<GitHubPullRequest[]> {
  const { data } = await octokit.pulls.list({
    owner,
    repo,
    state: 'all',
    sort: 'updated',
    direction: 'desc',
    per_page: 30,
  });

  return data.map((pr) => ({
    number: pr.number,
    title: pr.title,
    state: pr.state,
    author: pr.user?.login ?? 'unknown',
    created_at: pr.created_at,
    html_url: pr.html_url,
  }));
}
