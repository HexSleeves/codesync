/**
 * Repository list component for browse mode
 */

import { useMemo } from 'hono/jsx';
import { Badge, Card, CardContent, Input } from '@/components/ui';
import type { GitHubRepository } from './types';

interface RepositoryListProps {
  repositories: GitHubRepository[];
  searchQuery: string;
  onSelectRepo: (repo: GitHubRepository) => void;
  onSearchChange: (query: string) => void;
}

export function RepositoryList({
  repositories,
  searchQuery,
  onSelectRepo,
  onSearchChange,
}: RepositoryListProps) {
  const filteredRepos = useMemo(
    () =>
      repositories.filter((repo) =>
        repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [repositories, searchQuery]
  );

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <Input
        placeholder="Search repositories..."
        value={searchQuery}
        onInput={(e) => {
          const value = (e.target as HTMLInputElement).value;
          onSearchChange(value);
        }}
        className="mb-2"
      />
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredRepos.map((repo) => (
          <Card
            key={repo.id}
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onSelectRepo(repo)}
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
  );
}
