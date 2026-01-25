import type { File } from '@codesync/shared';

interface FileTreeItemProps {
  file: File;
  isSelected: boolean;
  onClick: () => void;
}

export function FileTreeItem({ file, isSelected, onClick }: FileTreeItemProps) {
  const getStatusIcon = () => {
    if (file.isAdded) return <span className="text-green-400">A</span>;
    if (file.isDeleted) return <span className="text-destructive">D</span>;
    if (file.isModified) return <span className="text-yellow-400">M</span>;
    return null;
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-accent ${
        isSelected ? 'bg-accent text-foreground' : 'text-muted-foreground'
      }`}
    >
      <span className="text-xs font-mono w-4">{getStatusIcon()}</span>
      <span className="truncate text-sm">{file.name}</span>
      {file.isReviewed && <span className="ml-auto text-green-400 text-xs">✓</span>}
    </button>
  );
}
