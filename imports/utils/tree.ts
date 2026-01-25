/**
 * Tree building utilities for file system representation
 */

import type { File } from '../api/files/files';

export interface TreeNode {
  name: string;
  path: string;
  isFile: boolean;
  file?: File;
  children: TreeNode[];
}

/**
 * Build a tree structure from a flat list of files
 */
export function buildTree(files: File[]): TreeNode[] {
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

/**
 * Flatten a tree back into a list of files
 */
export function flattenTree(nodes: TreeNode[]): File[] {
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

/**
 * Get all directory paths in a tree
 */
export function getAllPaths(node: TreeNode): string[] {
  const paths: string[] = [];

  if (!node.isFile) {
    paths.push(node.path);
    for (const child of node.children) {
      paths.push(...getAllPaths(child));
    }
  }

  return paths;
}

/**
 * Collect all directory paths from a tree
 */
export function collectAllDirectoryPaths(nodes: TreeNode[]): Set<string> {
  const paths = new Set<string>();

  const collectPaths = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      if (!node.isFile) {
        paths.add(node.path);
        collectPaths(node.children);
      }
    }
  };

  collectPaths(nodes);
  return paths;
}
