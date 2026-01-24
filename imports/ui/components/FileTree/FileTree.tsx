import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { File } from '../../../api/files/files';
import { FileNode, TreeNode } from './FileNode';

interface FileTreeProps {
  files: File[];
  selectedFileId: string | null;
  onFileSelect: (fileId: string) => void;
}

type FileFilter = 'all' | 'modified' | 'added' | 'deleted' | 'reviewed' | 'unreviewed';

function buildTree(files: File[]): TreeNode[] {
  const root: TreeNode[] = [];

  // Sort files by path
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sortedFiles) {
    const parts = file.path.split('/');
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      let existing = currentLevel.find(n => n.name === part);

      if (!existing) {
        existing = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          isFile,
          file: isFile ? file : undefined,
          children: [],
        };
        currentLevel.push(existing);
      }

      currentLevel = existing.children;
    }
  }

  return root;
}

function flattenTree(nodes: TreeNode[]): File[] {
  const files: File[] = [];
  const traverse = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      if (node.isFile && node.file) {
        files.push(node.file);
      } else {
        traverse(node.children);
      }
    }
  };
  traverse(nodes);
  return files;
}

export const FileTree: React.FC<FileTreeProps> = ({ files, selectedFileId, onFileSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FileFilter>('all');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const tree = useMemo(() => buildTree(files), [files]);

  const filteredFiles = useMemo(() => {
    let result = files;

    // Apply status filter
    switch (filter) {
      case 'modified':
        result = result.filter(f => f.isModified);
        break;
      case 'added':
        result = result.filter(f => f.isAdded);
        break;
      case 'deleted':
        result = result.filter(f => f.isDeleted);
        break;
      case 'reviewed':
        result = result.filter(f => f.isReviewed);
        break;
      case 'unreviewed':
        result = result.filter(f => !f.isReviewed);
        break;
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        f => f.path.toLowerCase().includes(query) || f.name.toLowerCase().includes(query)
      );
    }

    return result;
  }, [files, searchQuery, filter]);

  const filteredTree = useMemo(() => {
    if (!searchQuery && filter === 'all') return tree;
    return buildTree(filteredFiles);
  }, [searchQuery, filter, filteredFiles, tree]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      const fileList = flattenTree(filteredTree);
      const currentIndex = fileList.findIndex(f => f._id === selectedFileId);

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < fileList.length - 1 ? currentIndex + 1 : 0;
        if (fileList[nextIndex]) onFileSelect(fileList[nextIndex]._id);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : fileList.length - 1;
        if (fileList[prevIndex]) onFileSelect(fileList[prevIndex]._id);
      } else if (e.key === '/') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[data-file-search]')?.focus();
      }
    },
    [filteredTree, selectedFileId, onFileSelect]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleExpanded = (path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allPaths = new Set<string>();
    const collectPaths = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (!node.isFile) {
          allPaths.add(node.path);
          collectPaths(node.children);
        }
      }
    };
    collectPaths(tree);
    setExpandedPaths(allPaths);
  };

  const collapseAll = () => {
    setExpandedPaths(new Set());
  };

  // Stats for filter badges
  const stats = useMemo(
    () => ({
      modified: files.filter(f => f.isModified).length,
      added: files.filter(f => f.isAdded).length,
      deleted: files.filter(f => f.isDeleted).length,
      reviewed: files.filter(f => f.isReviewed).length,
      unreviewed: files.filter(f => !f.isReviewed).length,
    }),
    [files]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            data-file-search
            placeholder="Search files... (press /)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
          All ({files.length})
        </FilterButton>
        <FilterButton
          active={filter === 'modified'}
          onClick={() => setFilter('modified')}
          color="yellow"
        >
          M ({stats.modified})
        </FilterButton>
        <FilterButton active={filter === 'added'} onClick={() => setFilter('added')} color="green">
          A ({stats.added})
        </FilterButton>
        <FilterButton
          active={filter === 'deleted'}
          onClick={() => setFilter('deleted')}
          color="red"
        >
          D ({stats.deleted})
        </FilterButton>
        <FilterButton
          active={filter === 'unreviewed'}
          onClick={() => setFilter('unreviewed')}
          color="blue"
        >
          Pending ({stats.unreviewed})
        </FilterButton>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
        <button onClick={expandAll} className="hover:text-gray-700 dark:hover:text-gray-300">
          Expand all
        </button>
        <span>•</span>
        <button onClick={collapseAll} className="hover:text-gray-700 dark:hover:text-gray-300">
          Collapse all
        </button>
        <span className="ml-auto">
          {filteredFiles.length !== files.length ? `${filteredFiles.length}/` : ''}
          {files.length} files
        </span>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {filteredTree.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
            No files match your filter
          </div>
        ) : (
          filteredTree.map(node => (
            <FileNode
              key={node.path}
              node={node}
              depth={0}
              selectedFileId={selectedFileId}
              expandedPaths={
                searchQuery || filter !== 'all'
                  ? new Set([...expandedPaths, ...getAllPaths(node)])
                  : expandedPaths
              }
              onToggleExpanded={toggleExpanded}
              onFileSelect={onFileSelect}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  color?: 'yellow' | 'green' | 'red' | 'blue';
  children: React.ReactNode;
}

const FilterButton: React.FC<FilterButtonProps> = ({ active, onClick, color, children }) => {
  const colorClasses = {
    yellow: active ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500' : 'text-yellow-500',
    green: active ? 'bg-green-500/20 text-green-400 border-green-500' : 'text-green-500',
    red: active ? 'bg-red-500/20 text-red-400 border-red-500' : 'text-red-500',
    blue: active ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'text-blue-500',
  };

  const baseClass = active
    ? 'border-gray-500 bg-gray-500/20'
    : 'border-transparent hover:border-gray-500';

  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 text-xs rounded border transition-colors ${
        color ? colorClasses[color] : `${baseClass} ${active ? 'text-white' : 'text-gray-400'}`
      }`}
    >
      {children}
    </button>
  );
};

function getAllPaths(node: TreeNode): string[] {
  const paths: string[] = [];
  if (!node.isFile) {
    paths.push(node.path);
    for (const child of node.children) {
      paths.push(...getAllPaths(child));
    }
  }
  return paths;
}
