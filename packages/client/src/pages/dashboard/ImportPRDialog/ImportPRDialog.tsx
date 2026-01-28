/**
 * Main GitHub PR import dialog component
 * Supports both URL entry and repository browsing
 */

import { useCallback, useEffect, useState } from 'hono/jsx';
import { GitHubIcon } from '@/components/icons';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  toast,
} from '@/components/ui';
import { apiClient } from '../../../api/client';
import { PRBrowseView } from './PRBrowseView';
import { PRUrlForm } from './PRUrlForm';
import type { GitHubPullRequest, GitHubRepository, ImportMode, PRValidation } from './types';

interface ImportPRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (sessionId: string) => Promise<void>;
  githubConnected: boolean;
  onConnectGitHub: () => void;
}

export function ImportPRDialog({
  open,
  onOpenChange,
  onImport,
  githubConnected,
  onConnectGitHub,
}: ImportPRDialogProps) {
  const [mode, setMode] = useState<ImportMode>('url');
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<PRValidation | null>(null);

  // Browse mode state
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(null);
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingPRs, setLoadingPRs] = useState(false);
  const [repoSearch, setRepoSearch] = useState('');

  // Fetch repositories when switching to browse mode
  useEffect(() => {
    if (mode === 'browse' && githubConnected && repositories.length === 0) {
      fetchRepositories();
    }
  }, [mode, githubConnected]);

  const fetchRepositories = useCallback(async () => {
    setLoadingRepos(true);
    try {
      const res = await apiClient('/api/github/repositories');
      if (res.ok) {
        const data = await res.json();
        setRepositories(data.repositories);
      } else {
        toast.error('Failed to load repositories');
      }
    } catch (err) {
      console.error('Failed to load repositories:', err);
      toast.error('Failed to load repositories');
    } finally {
      setLoadingRepos(false);
    }
  }, []);

  const fetchPullRequests = useCallback(async (repo: GitHubRepository) => {
    setSelectedRepo(repo);
    setPullRequests([]);
    setLoadingPRs(true);
    try {
      const [owner, repoName] = repo.full_name.split('/');
      const res = await apiClient(`/api/github/repositories/${owner}/${repoName}/pulls`);
      if (res.ok) {
        const data = await res.json();
        setPullRequests(data.pullRequests);
      } else {
        toast.error('Failed to load pull requests');
      }
    } catch (err) {
      console.error('Failed to load pull requests:', err);
      toast.error('Failed to load pull requests');
    } finally {
      setLoadingPRs(false);
    }
  }, []);

  const [, setPrUrlFromBrowse] = useState<string>('');

  const handleValidateUrl = useCallback(async (url: string) => {
    if (!url.trim()) return;

    setValidating(true);
    setValidation(null);

    try {
      const res = await apiClient('/api/github/validate', {
        method: 'POST',
        body: JSON.stringify({ prUrl: url }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to validate PR URL');
        return;
      }

      const data = (await res.json()) as PRValidation;
      setValidation(data);
      if (data.needsAuth) {
        toast.warning('GitHub authentication required to import this PR');
      }
    } catch (_err) {
      toast.error('Failed to validate PR URL');
    } finally {
      setValidating(false);
    }
  }, []);

  const handleSelectPR = useCallback(
    async (pr: GitHubPullRequest) => {
      if (selectedRepo) {
        setPrUrlFromBrowse(pr.html_url);
        setMode('url');
        // Validate the selected PR URL
        await handleValidateUrl(pr.html_url);
      }
    },
    [selectedRepo, handleValidateUrl]
  );

  const handleImport = useCallback(
    async (prUrl: string) => {
      if (!prUrl.trim()) return;

      try {
        const res = await apiClient('/api/github/import', {
          method: 'POST',
          body: JSON.stringify({ prUrl }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.message || data.error || 'Failed to import PR');
          return;
        }

        toast.success('PR imported successfully!');
        await onImport(data.session.id);
        setValidation(null);
      } catch (_err) {
        toast.error('Failed to import PR');
      }
    },
    [onImport]
  );

  const handleModeChange = useCallback((newMode: ImportMode) => {
    setMode(newMode);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedRepo(null);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <GitHubIcon className="w-6 h-6" />
            <DialogTitle>Import from GitHub</DialogTitle>
          </div>
          <DialogDescription>Import a pull request to review</DialogDescription>
        </DialogHeader>

        {/* Mode Tabs */}
        <div className="flex gap-2 border-b border-border pb-2">
          <Button
            variant={mode === 'url' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleModeChange('url')}
          >
            Enter URL
          </Button>
          <Button
            variant={mode === 'browse' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleModeChange('browse')}
            disabled={!githubConnected}
          >
            Browse Repos
          </Button>
        </div>

        {mode === 'url' ? (
          <PRUrlForm
            onImport={handleImport}
            onValidate={handleValidateUrl}
            validation={validation}
            validating={validating}
            githubConnected={githubConnected}
            onConnectGitHub={onConnectGitHub}
            onCancel={() => onOpenChange(false)}
          />
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col space-y-3">
            <PRBrowseView
              githubConnected={githubConnected}
              loadingRepos={loadingRepos}
              repositories={repositories}
              selectedRepo={selectedRepo}
              pullRequests={pullRequests}
              loadingPRs={loadingPRs}
              repoSearch={repoSearch}
              onConnectGitHub={onConnectGitHub}
              onSelectRepo={fetchPullRequests}
              onSelectPR={handleSelectPR}
              onBack={handleBack}
              onSearchChange={setRepoSearch}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
