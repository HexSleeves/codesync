import type { File } from '@codesync/shared';
import { Badge, Button } from '@/components/ui';

interface FileHeaderProps {
  file: File;
  viewMode: 'code' | 'diff';
  diffMode: 'unified' | 'split';
  onViewModeChange: (mode: 'code' | 'diff') => void;
  onDiffModeChange: (mode: 'unified' | 'split') => void;
  /** Optional - if not provided, reviewed button won't show (read-only mode) */
  onToggleReviewed?: () => void;
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
    <div className="border-b border-border/50 bg-card/40 backdrop-blur-sm px-3 sm:px-4 py-2 shrink-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        {/* File path and status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <svg
            className="size-4 text-muted-foreground shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <span className="font-mono text-xs sm:text-sm text-foreground/80 truncate">
            {file.path}
          </span>
          {file.isReviewed && (
            <Badge variant="success" className="shrink-0 text-xs gap-1">
              <svg
                className="size-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Reviewed
            </Badge>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {onToggleReviewed && (
            <Button
              variant={file.isReviewed ? 'secondary' : 'default'}
              size="sm"
              onClick={onToggleReviewed}
              className="text-xs h-7 rounded-md"
            >
              {file.isReviewed ? (
                <>
                  <svg
                    className="size-3.5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="hidden sm:inline">Unmark</span>
                </>
              ) : (
                <>
                  <svg
                    className="size-3.5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="hidden sm:inline">Mark Reviewed</span>
                  <span className="sm:hidden">Reviewed</span>
                </>
              )}
            </Button>
          )}

          {/* View mode toggle */}
          <div className="flex rounded-md border border-border/50 overflow-hidden">
            <button
              onClick={() => onViewModeChange('diff')}
              className={`px-2.5 py-1 text-xs transition-colors ${
                viewMode === 'diff'
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
              }`}
            >
              Diff
            </button>
            <button
              onClick={() => onViewModeChange('code')}
              className={`px-2.5 py-1 text-xs transition-colors border-l border-border/50 ${
                viewMode === 'code'
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
              }`}
            >
              Code
            </button>
          </div>

          {viewMode === 'diff' && (
            <div className="flex rounded-md border border-border/50 overflow-hidden">
              <button
                onClick={() => onDiffModeChange('unified')}
                className={`px-2.5 py-1 text-xs transition-colors ${
                  diffMode === 'unified'
                    ? 'bg-primary/15 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                }`}
              >
                Unified
              </button>
              <button
                onClick={() => onDiffModeChange('split')}
                className={`px-2.5 py-1 text-xs transition-colors border-l border-border/50 ${
                  diffMode === 'split'
                    ? 'bg-primary/15 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                }`}
              >
                Split
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
