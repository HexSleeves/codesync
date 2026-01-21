export interface GitHubPRInfo {
  owner: string;
  repo: string;
  prNumber: number;
}

export interface GitHubPRData {
  title: string;
  body: string | null;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  user: {
    login: string;
  };
  html_url: string;
  state: string;
}

export interface GitHubPRFile {
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  previous_filename?: string;
  sha: string;
  blob_url: string;
  raw_url: string;
  contents_url: string;
}
