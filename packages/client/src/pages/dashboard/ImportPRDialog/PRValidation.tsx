/**
 * PR Validation result components
 */

import { GitHubIcon } from '@/components/icons';
import { Badge, Button, Card, CardContent } from '@/components/ui';
import type { PRValidation } from './types';

interface PRValidationResultProps {
  validation: PRValidation;
  githubConnected: boolean;
  onConnectGitHub: () => void;
}

export function PRValidationResult({
  validation,
  githubConnected,
  onConnectGitHub,
}: PRValidationResultProps) {
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
