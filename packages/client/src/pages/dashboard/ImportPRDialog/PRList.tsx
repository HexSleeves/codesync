/**
 * Pull request list component
 */

import type { FC } from 'hono/jsx';
import { ChevronLeft } from 'lucide-react';
import { Badge, Button, Card, CardContent, Spinner } from '@/components/ui';
import type { GitHubPullRequest } from './types';

const ChevronLeftIcon = ChevronLeft as unknown as FC<{ className?: string }>;

interface PRListProps {
  pullRequests: GitHubPullRequest[];
  loading: boolean;
  repoName: string;
  onSelectPR: (pr: GitHubPullRequest) => void;
  onBack: () => void;
}

export function PRList({ pullRequests, loading, repoName, onSelectPR, onBack }: PRListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (pullRequests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <p className="text-muted-foreground text-sm">No pull requests found</p>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeftIcon className="w-4 h-4" /> Back to repos
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeftIcon className="w-4 h-4" /> Back
        </Button>
        <span className="font-medium text-sm">{repoName}</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2">
        {pullRequests.map((pr) => (
          <Card
            key={pr.number}
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onSelectPR(pr)}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{pr.title}</p>
                  <p className="text-xs text-muted-foreground">
                    #{pr.number} by {pr.author}
                  </p>
                </div>
                <Badge variant={pr.state === 'open' ? 'success' : 'secondary'} className="shrink-0">
                  {pr.state}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
