import type { File } from '@codesync/shared';
import { cn } from '@/lib/utils';

interface FileTreeItemProps {
  file: File;
  isSelected: boolean;
  onClick: () => void;
}

export function FileTreeItem({ file, isSelected, onClick }: FileTreeItemProps) {
  const getStatusIndicator = () => {
    if (file.isAdded) return { color: 'bg-emerald-400', label: 'A' };
    if (file.isDeleted) return { color: 'bg-red-400', label: 'D' };
    if (file.isModified) return { color: 'bg-amber-400', label: 'M' };
    return null;
  };

  const status = getStatusIndicator();

  // Get file extension for icon coloring
  const ext = file.name.split('.').pop()?.toLowerCase();
  const iconColor = getFileIconColor(ext);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-1.5 flex items-center gap-2.5 transition-all duration-150 group',
        isSelected
          ? 'bg-primary/10 text-foreground border-l-2 border-primary'
          : 'text-muted-foreground hover:bg-accent/30 hover:text-foreground border-l-2 border-transparent'
      )}
    >
      {/* File icon */}
      <svg className={cn('size-3.5 shrink-0', iconColor)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>

      {/* File name */}
      <span className="truncate text-sm font-mono">{file.name}</span>

      {/* Status + Reviewed indicators */}
      <div className="ml-auto flex items-center gap-1.5 shrink-0">
        {status && (
          <span className={cn(
            'text-[10px] font-semibold font-mono px-1 py-0.5 rounded',
            file.isAdded && 'text-emerald-400 bg-emerald-400/10',
            file.isDeleted && 'text-red-400 bg-red-400/10',
            file.isModified && 'text-amber-400 bg-amber-400/10'
          )}>
            {status.label}
          </span>
        )}
        {file.isReviewed && (
          <svg className="size-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
      </div>
    </button>
  );
}

function getFileIconColor(ext?: string): string {
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'text-blue-400';
    case 'js':
    case 'jsx':
      return 'text-yellow-400';
    case 'css':
    case 'scss':
      return 'text-pink-400';
    case 'html':
      return 'text-orange-400';
    case 'json':
      return 'text-amber-400';
    case 'md':
      return 'text-gray-400';
    case 'py':
      return 'text-green-400';
    case 'rs':
      return 'text-orange-300';
    case 'go':
      return 'text-cyan-400';
    default:
      return 'text-muted-foreground';
  }
}
