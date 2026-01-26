/**
 * GitHub PR import dialog
 */

import { useState } from 'hono/jsx';
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
import { GitHubIcon } from '@/components/icons';
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
  const [prUrl, setPrUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);

  const [validation, setValidation] = useState<PRValidation | null>(null);

  const handleValidate = async () => {
    if (!prUrl.trim()) return;

    setValidating(true);
    setValidation(null);

    try {
      const res = await apiClient('/api/github/validate', {
        method: 'POST',
        body: JSON.stringify({ prUrl }),
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <GitHubIcon className="w-6 h-6" />
            <DialogTitle>Import from GitHub</DialogTitle>
          </div>
          <DialogDescription>Import a pull request to review</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleImport} className="space-y-4">
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
