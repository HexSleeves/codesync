/**
 * File Tree Sidebar - Shows file list and online users
 * Used in Session and SharedSession pages
 */

import type { File, OnlineUser } from '@codesync/shared';
import type { Child } from 'hono/jsx';
import { Sidebar } from '@/components/layout/Sidebar';
import { FileTree } from './FileTree';
import { OnlineUsers } from './OnlineUsers';

interface FileTreeSidebarProps {
  /** Whether the sidebar is visible */
  open: boolean;
  /** Callback when sidebar should close */
  onClose: () => void;
  /** List of files to display */
  files: File[];
  /** Currently selected file ID */
  selectedFileId: string | null;
  /** Callback when a file is selected */
  onFileSelect: (id: string) => void;
  /** Online users (optional, for collaborative sessions) */
  onlineUsers?: OnlineUser[];
  /** WebSocket connection status */
  connected?: boolean;
  /** Whether to close sidebar on mobile after file selection */
  closeOnSelect?: boolean;
  /** Optional header content (shown above file tree on desktop) */
  headerContent?: Child;
}

export function FileTreeSidebar({
  open,
  onClose,
  files,
  selectedFileId,
  onFileSelect,
  onlineUsers,
  connected,
  closeOnSelect = true,
  headerContent,
}: FileTreeSidebarProps) {
  const handleFileSelect = (id: string) => {
    onFileSelect(id);
    // On mobile, close sidebar after selection
    if (closeOnSelect && window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <Sidebar open={open} onClose={onClose} side="left" title="Files" width="w-64">
      {/* Online users (if provided) */}
      {onlineUsers && <OnlineUsers users={onlineUsers} connected={connected ?? false} />}

      {/* Optional header content */}
      {headerContent && !onlineUsers && (
        <div className="px-3 py-2 border-b border-border">{headerContent}</div>
      )}

      {/* File tree */}
      <div className="flex-1 overflow-hidden">
        <FileTree files={files} selectedFileId={selectedFileId} onFileSelect={handleFileSelect} />
      </div>
    </Sidebar>
  );
}
