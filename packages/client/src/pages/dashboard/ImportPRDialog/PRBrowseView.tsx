/**
 * Browse mode view component - handles repository browsing and PR selection
 */

import { GitHubIcon } from '@/components/icons';
import { Button, Spinner } from '@/components/ui';
import { PRList } from './PRList';
import { RepositoryList } from './RepositoryList';
import type { GitHubPullRequest, GitHubRepository } from './types';

interface PRBrowseViewProps {
  githubConnected: boolean;
  loadingRepos: boolean;
  repositories: GitHubRepository[];
  selectedRepo: GitHubRepository | null;
  pullRequests: GitHubPullRequest[];
  loadingPRs: boolean;
  repoSearch: string;
  onConnectGitHub: () => void;
  onSelectRepo: (repo: GitHubRepository) => void;
  onSelectPR: (pr: GitHubPullRequest) => void;
  onBack: () => void;
  onSearchChange: (query: string) => void;
}

export function PRBrowseView({
  githubConnected,
  loadingRepos,
  repositories,
  selectedRepo,
  pullRequests,
  loadingPRs,
  repoSearch,
  onConnectGitHub,
  onSelectRepo,
  onSelectPR,
  onBack,
  onSearchChange,
}: PRBrowseViewProps) {
  if (!githubConnected) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Connect your GitHub account to browse repositories</p>
        <Button onClick={onConnectGitHub}>
          <GitHubIcon className="w-4 h-4 mr-2" />
          Connect GitHub
        </Button>
      </div>
    );
  }

  if (loadingRepos) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (selectedRepo) {
    return (
      <PRList
        pullRequests={pullRequests}
        loading={loadingPRs}
        repoName={selectedRepo.full_name}
        onSelectPR={onSelectPR}
        onBack={onBack}
      />
    );
  }

  return (
    <RepositoryList
      repositories={repositories}
      searchQuery={repoSearch}
      onSelectRepo={onSelectRepo}
      onSearchChange={onSearchChange}
    />
  );
}
