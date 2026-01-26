import type { File } from '@codesync/shared';
import { Badge, Button, Select, SelectOption } from '@/components/ui';

interface FileHeaderProps {
  file: File;
  viewMode: 'code' | 'diff';
  diffMode: 'unified' | 'split';
  onViewModeChange: (mode: 'code' | 'diff') => void;
  onDiffModeChange: (mode: 'unified' | 'split') => void;
  onToggleReviewed: () => void;
}

export function FileHeader({
  file,
  viewMode,
  diffMode,
  onViewModeChange,
  onDiffModeChange,
  onToggleReviewed,
}: FileHeaderProps) {
  return (
    <div className="border-b border-border bg-card px-2 sm:px-4 py-2 shrink-0">
      {/* Mobile: Stack vertically */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        {/* File path and status */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs sm:text-sm text-muted-foreground truncate">
            {file.path}
          </span>
          {file.isReviewed && (
            <Badge variant="success" className="shrink-0 text-xs">
              ✓
            </Badge>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={file.isReviewed ? 'secondary' : 'default'}
            size="sm"
            onClick={onToggleReviewed}
            className="text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">
              {file.isReviewed ? 'Unmark Reviewed' : 'Mark Reviewed'}
            </span>
            <span className="sm:hidden">{file.isReviewed ? 'Unmark' : 'Reviewed'}</span>
          </Button>
          <Select
            value={viewMode}
            onChange={(e) =>
              onViewModeChange((e.target as HTMLSelectElement).value as 'code' | 'diff')
            }
            className="w-24 sm:w-32 text-xs sm:text-sm"
          >
            <SelectOption value="diff">Diff</SelectOption>
            <SelectOption value="code">Code</SelectOption>
          </Select>
          {viewMode === 'diff' && (
            <Select
              value={diffMode}
              onChange={(e) =>
                onDiffModeChange((e.target as HTMLSelectElement).value as 'unified' | 'split')
              }
              className="w-20 sm:w-28 text-xs sm:text-sm"
            >
              <SelectOption value="unified">Unified</SelectOption>
              <SelectOption value="split">Split</SelectOption>
            </Select>
          )}
        </div>
      </div>
    </div>
  );
}
