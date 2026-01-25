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
    <div className="border-b border-border bg-card px-4 py-2 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-muted-foreground">{file.path}</span>
        {file.isReviewed && <Badge variant="success">✓ Reviewed</Badge>}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={file.isReviewed ? 'secondary' : 'default'}
          size="sm"
          onClick={onToggleReviewed}
        >
          {file.isReviewed ? 'Unmark Reviewed' : 'Mark Reviewed'}
        </Button>
        <Select
          value={viewMode}
          onChange={(e) => onViewModeChange((e.target as HTMLSelectElement).value as 'code' | 'diff')}
          className="w-32"
        >
          <SelectOption value="diff">Diff View</SelectOption>
          <SelectOption value="code">Code View</SelectOption>
        </Select>
        {viewMode === 'diff' && (
          <Select
            value={diffMode}
            onChange={(e) => onDiffModeChange((e.target as HTMLSelectElement).value as 'unified' | 'split')}
            className="w-28"
          >
            <SelectOption value="unified">Unified</SelectOption>
            <SelectOption value="split">Split</SelectOption>
          </Select>
        )}
      </div>
    </div>
  );
}
