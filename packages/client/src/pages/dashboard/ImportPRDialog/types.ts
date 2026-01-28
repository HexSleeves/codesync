/**
 * Shared types for ImportPRDialog components
 */

export interface PRValidation {
  valid: boolean;
  prInfo?: {
    owner: string;
    repo: string;
    prNumber: number;
  };
  prData?: {
    title: string;
    body: string | null;
    state: string;
    author: string;
    branch: string;
    url: string;
  };
  needsAuth?: boolean;
  message?: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  state: string;
  author: string;
  created_at: string;
  html_url: string;
}

export type ImportMode = 'url' | 'browse';
