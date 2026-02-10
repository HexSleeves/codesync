/**
 * Add Files Dialog - paste code or upload files to a session
 */

import { useCallback, useRef, useState } from 'hono/jsx';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  toast,
} from '@/components/ui';
import { apiCall } from '@/api/client';

// Language detection by file extension (client-side mirror of server util)
const LANG_MAP: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  py: 'python',
  rb: 'ruby',
  java: 'java',
  go: 'go',
  rs: 'rust',
  cpp: 'cpp',
  cc: 'cpp',
  c: 'c',
  h: 'c',
  hpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  html: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  xml: 'xml',
  svg: 'xml',
  md: 'markdown',
  mdx: 'markdown',
  sh: 'bash',
  bash: 'bash',
  sql: 'sql',
  graphql: 'graphql',
  gql: 'graphql',
};

function detectLanguage(filename: string): string | undefined {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? LANG_MAP[ext] : undefined;
}

function getFilename(path: string): string {
  return path.split('/').pop() || path;
}

// ============================================================================

interface PendingFile {
  id: string;
  path: string;
  name: string;
  content: string;
  originalContent?: string;
  language?: string;
}

interface AddFilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  onDone: () => void;
}

export function AddFilesDialog({ open, onOpenChange, sessionId, onDone }: AddFilesDialogProps) {
  const [tab, setTab] = useState<'paste' | 'upload'>('paste');
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Paste state
  const [pasteFilename, setPasteFilename] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [pasteOriginal, setPasteOriginal] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);

  // Upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addPastedFile = useCallback(() => {
    const name = pasteFilename.trim() || 'untitled.txt';
    const path = name;
    setFiles((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        path,
        name: getFilename(path),
        content: pasteContent,
        originalContent: showOriginal && pasteOriginal ? pasteOriginal : undefined,
        language: detectLanguage(name),
      },
    ]);
    setPasteFilename('');
    setPasteContent('');
    setPasteOriginal('');
    setShowOriginal(false);
    toast.success(`Added ${getFilename(name)}`);
  }, [pasteFilename, pasteContent, pasteOriginal, showOriginal]);

  const handleFileUpload = useCallback(async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const uploadedFiles = input.files;
    if (!uploadedFiles) return;

    const newFiles: PendingFile[] = [];
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      // Skip very large files
      if (file.size > 1024 * 1024) {
        toast.error(`${file.name} is too large (max 1MB)`);
        continue;
      }
      try {
        const content = await file.text();
        const path = file.webkitRelativePath || file.name;
        newFiles.push({
          id: crypto.randomUUID(),
          path,
          name: getFilename(path),
          content,
          language: detectLanguage(file.name),
        });
      } catch {
        toast.error(`Failed to read ${file.name}`);
      }
    }

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
      toast.success(`Added ${newFiles.length} file${newFiles.length > 1 ? 's' : ''}`);
    }
    // Reset input
    input.value = '';
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (files.length === 0) {
      toast.error('Add at least one file');
      return;
    }
    setSubmitting(true);
    try {
      let added = 0;
      for (const file of files) {
        await apiCall('POST', `/sessions/${sessionId}/files`, {
          path: file.path,
          name: file.name,
          content: file.content,
          originalContent: file.originalContent,
          language: file.language,
          isAdded: !file.originalContent,
          isModified: !!file.originalContent,
        });
        added++;
      }
      toast.success(`Uploaded ${added} file${added > 1 ? 's' : ''} to session`);
      setFiles([]);
      onDone();
    } catch (err) {
      toast.error('Failed to upload files');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }, [files, sessionId, onDone]);

  const handleClose = useCallback(() => {
    if (files.length === 0) {
      onOpenChange(false);
    } else {
      // If there are staged files, go to session without uploading
      onOpenChange(false);
    }
  }, [files, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Files</DialogTitle>
          <DialogDescription>Paste code or upload files for review</DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-4">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'paste'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab('paste')}
          >
            Paste Code
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'upload'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab('upload')}
          >
            Upload Files
          </button>
        </div>

        {/* Paste Tab */}
        {tab === 'paste' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="paste-filename">Filename</Label>
              <Input
                id="paste-filename"
                placeholder="e.g. src/App.tsx"
                value={pasteFilename}
                onInput={(e: Event) => setPasteFilename((e.target as HTMLInputElement).value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="paste-content">Code</Label>
              <Textarea
                id="paste-content"
                placeholder="Paste your code here..."
                rows={10}
                className="font-mono text-sm"
                value={pasteContent}
                onInput={(e: Event) => setPasteContent((e.target as HTMLTextAreaElement).value)}
              />
            </div>

            {/* Optional: original content for diff */}
            <div>
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                onClick={() => setShowOriginal(!showOriginal)}
              >
                <svg
                  className={`w-3 h-3 transition-transform ${showOriginal ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m9 18 6-6-6-6"
                  />
                </svg>
                {showOriginal ? 'Hide' : 'Add'} original version (for diff)
              </button>
              {showOriginal && (
                <div className="mt-2 space-y-1.5">
                  <Label htmlFor="paste-original">Original Code</Label>
                  <Textarea
                    id="paste-original"
                    placeholder="Paste the original version to compare against..."
                    rows={8}
                    className="font-mono text-sm"
                    value={pasteOriginal}
                    onInput={(e: Event) =>
                      setPasteOriginal((e.target as HTMLTextAreaElement).value)
                    }
                  />
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={addPastedFile}
              disabled={!pasteContent.trim()}
              className="w-full"
            >
              + Add File
            </Button>
          </div>
        )}

        {/* Upload Tab */}
        {tab === 'upload' && (
          <div className="space-y-3">
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e: DragEvent) => {
                e.preventDefault();
                (e.currentTarget as HTMLElement).classList.add('border-primary');
              }}
              onDragLeave={(e: DragEvent) => {
                (e.currentTarget as HTMLElement).classList.remove('border-primary');
              }}
              onDrop={(e: DragEvent) => {
                e.preventDefault();
                (e.currentTarget as HTMLElement).classList.remove('border-primary');
                if (e.dataTransfer?.files) {
                  const input = fileInputRef.current;
                  if (input) {
                    // Create a synthetic event
                    const dt = new DataTransfer();
                    for (let i = 0; i < e.dataTransfer.files.length; i++) {
                      dt.items.add(e.dataTransfer.files[i]);
                    }
                    input.files = dt.files;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                  }
                }
              }}
            >
              <svg
                className="w-10 h-10 mx-auto text-muted-foreground mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                />
              </svg>
              <p className="text-sm font-medium text-foreground">
                Click to browse or drag files here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Text files only · Max 1MB per file
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              accept=".js,.jsx,.ts,.tsx,.py,.rb,.java,.go,.rs,.c,.cpp,.h,.cs,.php,.html,.css,.scss,.json,.yaml,.yml,.toml,.xml,.md,.sh,.sql,.graphql,.txt,.env,.gitignore,.dockerfile,Makefile"
            />
          </div>
        )}

        {/* Staged Files List */}
        {files.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-foreground mb-2">
              Staged Files ({files.length})
            </h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between gap-2 px-3 py-1.5 rounded bg-muted/50 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-muted-foreground text-xs font-mono">
                      {file.language || 'txt'}
                    </span>
                    <span className="truncate text-foreground" title={file.path}>
                      {file.path}
                    </span>
                    {file.originalContent && (
                      <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        diff
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => removeFile(file.id)}
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="gap-2 mt-4">
          <Button type="button" variant="ghost" onClick={handleClose}>
            {files.length > 0 ? 'Skip' : 'Cancel'}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={files.length === 0 || submitting}>
            {submitting
              ? 'Uploading...'
              : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
