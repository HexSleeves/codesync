import type { File } from '@codesync/shared';
import { FileTreeItem } from './FileTreeItem';

interface FileTreeProps {
  files: File[];
  selectedFileId: string | null;
  onFileSelect: (fileId: string) => void;
}

export function FileTree({ files, selectedFileId, onFileSelect }: FileTreeProps) {
  return (
    <aside className="w-64 border-r border-border bg-card overflow-y-auto shrink-0">
      <div className="p-3 border-b border-border">
        <h2 className="text-sm font-medium text-muted-foreground">Files ({files.length})</h2>
      </div>
      <div className="py-2">
        {files.map((file) => (
          <FileTreeItem
            key={file.id}
            file={file}
            isSelected={file.id === selectedFileId}
            onClick={() => onFileSelect(file.id)}
          />
        ))}
      </div>
    </aside>
  );
}
