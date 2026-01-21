import React from 'react';
import { File } from '../../../api/files/files';
import { FileIcon } from './FileIcon';
import { getFileStatusIcon } from '../../utils/file-icons';

export interface TreeNode {
  name: string;
  path: string;
  isFile: boolean;
  file?: File;
  children: TreeNode[];
}

interface FileNodeProps {
  node: TreeNode;
  depth: number;
  selectedFileId: string | null;
  expandedPaths: Set<string>;
  onToggleExpanded: (path: string) => void;
  onFileSelect: (fileId: string) => void;
}

export const FileNode: React.FC<FileNodeProps> = ({
  node,
  depth,
  selectedFileId,
  expandedPaths,
  onToggleExpanded,
  onFileSelect
}) => {
  const isExpanded = expandedPaths.has(node.path);
  const isSelected = node.file?._id === selectedFileId;
  
  const handleClick = () => {
    if (node.isFile && node.file) {
      onFileSelect(node.file._id);
    } else {
      onToggleExpanded(node.path);
    }
  };
  
  const status = node.file ? getFileStatusIcon({
    isAdded: node.file.isAdded,
    isDeleted: node.file.isDeleted,
    isModified: node.file.isModified,
    isRenamed: node.file.isRenamed
  }) : null;
  
  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer text-sm ${
          isSelected
            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {/* Expand/collapse arrow for folders */}
        {!node.isFile ? (
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          <span className="w-4" />
        )}
        
        {/* Icon */}
        {node.isFile ? (
          <FileIcon extension={node.file?.extension || ''} />
        ) : (
          <svg
            className={`w-4 h-4 ${isExpanded ? 'text-blue-500' : 'text-gray-400'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            {isExpanded ? (
              <path fillRule="evenodd" d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
            ) : (
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            )}
          </svg>
        )}
        
        {/* Name */}
        <span className="truncate flex-1">{node.name}</span>
        
        {/* Status indicator */}
        {status && status.icon && (
          <span
            className="text-sm font-bold"
            style={{ color: status.color }}
            title={node.file?.isAdded ? 'Added' : node.file?.isDeleted ? 'Deleted' : node.file?.isRenamed ? 'Renamed' : 'Modified'}
          >
            {status.icon}
          </span>
        )}
        
        {/* Review status */}
        {node.file?.isReviewed && (
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      
      {/* Children */}
      {!node.isFile && isExpanded && (
        <div>
          {node.children.map(child => (
            <FileNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedFileId={selectedFileId}
              expandedPaths={expandedPaths}
              onToggleExpanded={onToggleExpanded}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};
