/**
 * GitHub PR import dialog
 * Supports both URL entry and repository browsing
 */

import { useEffect, useState } from 'hono/jsx';
import { GitHubIcon } from '@/components/icons';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Spinner,
  toast,
} from '@/components/ui';
import { apiClient } from '../../api/client';

interface PRValidation {
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

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
}

interface GitHubPullRequest {
  number: number;
  title: string;
  state: string;
  author: string;
  created_at: string;
  html_url: string;
}

interface ImportPRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (sessionId: string) => Promise<void>;
  githubConnected: boolean;
  onConnectGitHub: () => void;
}

type ImportMode = 'url' | 'browse';

export function ImportPRDialog({
  open,
  onOpenChange,
  onImport,
  githubConnected,
  onConnectGitHub,
}: ImportPRDialogProps) {
  const [mode, setMode] = useState<ImportMode>('url');
  const [prUrl, setPrUrl] = useState('');
  const [loading, setLoading] = useState(false);
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

  const fetchRepositories = async () => {
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
      toast.error('Failed to load repositories');
    } finally {
      setLoadingRepos(false);
    }
  };

  const fetchPullRequests = async (repo: GitHubRepository) => {
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
      toast.error('Failed to load pull requests');
    } finally {
      setLoadingPRs(false);
    }
  };

  const handleSelectPR = (pr: GitHubPullRequest) => {
    if (selectedRepo) {
      setPrUrl(pr.html_url);
      setMode('url');
      // Auto-validate
      handleValidateUrl(pr.html_url);
    }
  };

  const handleValidateUrl = async (url: string) => {
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
  };

  const handleValidate = () => handleValidateUrl(prUrl);

  const handleImport = async (e: Event) => {
    e.preventDefault();
    if (!prUrl.trim()) return;

    setLoading(true);

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
    } catch (_err) {
      toast.error('Failed to import PR');
    } finally {
      setLoading(false);
    }
  };

  const filteredRepos = repositories.filter((repo) =>
    repo.full_name.toLowerCase().includes(repoSearch.toLowerCase())
  );

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
            onClick={() => setMode('url')}
          >
            Enter URL
          </Button>
          <Button
            variant={mode === 'browse' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('browse')}
            disabled={!githubConnected}
          >
            Browse Repos
          </Button>
        </div>

        {mode === 'url' ? (
          <form onSubmit={handleImport} className="space-y-4 flex-1">
            <div className="space-y-2">
              <Label htmlFor="prUrl">Pull Request URL</Label>
              <div className="flex gap-2">
                <Input
                  id="prUrl"
                  type="url"
                  value={prUrl}
                  onInput={(e) => {
                    setPrUrl((e.target as HTMLInputElement).value);
                    setValidation(null);
                  }}
                  placeholder="https://github.com/owner/repo/pull/123"
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleValidate}
                  disabled={!prUrl.trim() || validating}
                >
                  {validating ? 'Checking...' : 'Validate'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Supports formats: https://github.com/owner/repo/pull/123 or owner/repo#123
              </p>
            </div>

            {validation && (
              <PRValidationResult
                validation={validation}
                githubConnected={githubConnected}
                onConnectGitHub={onConnectGitHub}
              />
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !prUrl.trim() || (validation?.needsAuth ?? false)}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Importing...
                  </>
                ) : (
                  'Import PR'
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col space-y-3">
            {!githubConnected ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Connect your GitHub account to browse repositories
                </p>
                <Button onClick={onConnectGitHub}>
                  <GitHubIcon className="w-4 h-4 mr-2" />
                  Connect GitHub
                </Button>
              </div>
            ) : loadingRepos ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : selectedRepo ? (
              /* PR List */
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedRepo(null)}>
                    ← Back
                  </Button>
                  <span className="font-medium text-sm">{selectedRepo.full_name}</span>
                </div>
                {loadingPRs ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner size="md" />
                  </div>
                ) : pullRequests.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No pull requests found
                  </p>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {pullRequests.map((pr) => (
                      <Card
                        key={pr.number}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handleSelectPR(pr)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{pr.title}</p>
                              <p className="text-xs text-muted-foreground">
                                #{pr.number} by {pr.author}
                              </p>
                            </div>
                            <Badge
                              variant={pr.state === 'open' ? 'success' : 'secondary'}
                              className="shrink-0"
                            >
                              {pr.state}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Repository List */
              <div className="flex-1 overflow-hidden flex flex-col">
                <Input
                  placeholder="Search repositories..."
                  value={repoSearch}
                  onInput={(e) => setRepoSearch((e.target as HTMLInputElement).value)}
                  className="mb-2"
                />
                <div className="flex-1 overflow-y-auto space-y-2">
                  {filteredRepos.map((repo) => (
                    <Card
                      key={repo.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => fetchPullRequests(repo)}
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{repo.full_name}</p>
                        </div>
                        {repo.private && (
                          <Badge variant="secondary" className="text-xs">
                            Private
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {filteredRepos.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      No repositories found
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PRValidationResult({
  validation,
  githubConnected,
  onConnectGitHub,
}: {
  validation: PRValidation;
  githubConnected: boolean;
  onConnectGitHub: () => void;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        {validation.needsAuth ? (
          <AuthRequiredMessage
            validation={validation}
            githubConnected={githubConnected}
            onConnectGitHub={onConnectGitHub}
          />
        ) : validation.prData ? (
          <PRDetails prData={validation.prData} />
        ) : (
          <p className="text-green-400">✓ Valid PR URL</p>
        )}
      </CardContent>
    </Card>
  );
}

function AuthRequiredMessage({
  validation,
  githubConnected,
  onConnectGitHub,
}: {
  validation: PRValidation;
  githubConnected: boolean;
  onConnectGitHub: () => void;
}) {
  return (
    <div>
      <p className="font-medium text-yellow-400">GitHub Authentication Required</p>
      <p className="text-sm mt-1 text-muted-foreground">
        {validation.message || 'Connect your GitHub account to import pull requests.'}
      </p>
      <p className="text-xs mt-2 text-muted-foreground">
        PR: {validation.prInfo?.owner}/{validation.prInfo?.repo}#{validation.prInfo?.prNumber}
      </p>
      {!githubConnected && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onConnectGitHub}
          className="mt-3"
        >
          <GitHubIcon className="w-4 h-4 mr-2" />
          Connect GitHub Account
        </Button>
      )}
    </div>
  );
}

function PRDetails({ prData }: { prData: NonNullable<PRValidation['prData']> }) {
  return (
    <div>
      <p className="font-medium text-foreground">{prData.title}</p>
      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
        <p>
          <span className="text-muted-foreground/70">Author:</span> {prData.author}
        </p>
        <p>
          <span className="text-muted-foreground/70">Branch:</span> {prData.branch}
        </p>
        <p>
          <span className="text-muted-foreground/70">Status:</span>{' '}
          <Badge variant={prData.state === 'open' ? 'success' : 'secondary'}>{prData.state}</Badge>
        </p>
      </div>
    </div>
  );
}
