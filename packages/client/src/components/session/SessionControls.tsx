/**
 * Session Controls - Header controls for session page
 * Includes sidebar toggle, review actions, share button, online users
 */

import type { OnlineUser, Session } from '@codesync/shared';
import { ShareIcon, SidebarIcon, UsersIcon } from '@/components/icons';
import { Button } from '@/components/ui';
import { ReviewActions } from './ReviewActions';

interface SessionControlsProps {
  /** Full session object (for review actions) */
  session: Session;
  /** Whether file tree sidebar is visible */
  showFileTree: boolean;
  /** Toggle file tree visibility */
  onToggleFileTree: () => void;
  /** Open share modal */
  onShare: () => void;
  /** Callback when session status changes */
  onSessionChange: (session: Session) => void;
  /** WebSocket connection status */
  connected: boolean;
  /** Online users */
  onlineUsers: OnlineUser[];
  /** Current user ID */
  currentUserId?: string;
}

export function SessionControls({
  session,
  showFileTree,
  onToggleFileTree,
  onShare,
  onSessionChange,
  connected,
  onlineUsers,
  currentUserId,
}: SessionControlsProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Sidebar toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleFileTree}
        aria-label={showFileTree ? 'Hide sidebar' : 'Show sidebar'}
        className="gap-1.5"
      >
        <SidebarIcon className="size-4" />
        <span className="hidden lg:inline">Files</span>
      </Button>

      {/* Review actions (status + transition buttons) */}
      <ReviewActions
        session={session}
        onStatusChange={onSessionChange}
        currentUserId={currentUserId}
      />

      {/* Share button */}
      <Button variant="outline" size="sm" onClick={onShare} className="gap-1.5">
        <ShareIcon className="size-4" />
        <span className="hidden lg:inline">Share</span>
      </Button>

      {/* Online users indicator */}
      <OnlineUsersIndicator connected={connected} count={onlineUsers.length} />
    </div>
  );
}

interface OnlineUsersIndicatorProps {
  connected: boolean;
  count: number;
}

export function OnlineUsersIndicator({ connected, count }: OnlineUsersIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <div className={`size-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
      <UsersIcon className="size-4" />
      <span className="tabular-nums">{count}</span>
    </div>
  );
}
