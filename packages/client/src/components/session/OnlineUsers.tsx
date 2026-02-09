/**
 * Online users display component
 * Shows avatars of users currently in the session
 */

import type { OnlineUser } from '@codesync/shared';
import { Avatar, AvatarFallback } from '../ui';

interface OnlineUsersProps {
  users: OnlineUser[];
  connected: boolean;
}

export function OnlineUsers({ users, connected }: OnlineUsersProps) {
  return (
    <div class="flex items-center gap-2.5 px-3 py-2.5 border-b border-border/50">
      {/* Connection indicator */}
      <div class="flex items-center gap-1.5">
        <div
          class={`size-1.5 rounded-full ${connected ? 'bg-emerald-400 shadow-[0_0_4px_oklch(0.7_0.15_155)]' : 'bg-red-400'}`}
          title={connected ? 'Connected' : 'Disconnected'}
        />
        <span class="text-[11px] text-muted-foreground font-medium">
          {connected ? `${users.length} online` : 'Connecting...'}
        </span>
      </div>

      {/* User avatars */}
      {users.length > 0 && (
        <div class="flex -space-x-1.5 ml-auto">
          {users.slice(0, 5).map((user) => (
            <Avatar key={user.userId} className="size-5 border border-background ring-1 ring-border/20">
              <AvatarFallback
                className="text-[9px] text-white font-medium"
                style={{ backgroundColor: user.color }}
              >
                {user.userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
          {users.length > 5 && (
            <div class="size-5 rounded-full bg-muted border border-background flex items-center justify-center ring-1 ring-border/20">
              <span class="text-[9px] text-muted-foreground">+{users.length - 5}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
