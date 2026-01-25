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
    <div class="flex items-center gap-2 px-3 py-2 border-b border-border">
      {/* Connection indicator */}
      <div
        class={`w-2 h-2 rounded-full ${
          connected ? 'bg-green-500' : 'bg-red-500'
        }`}
        title={connected ? 'Connected' : 'Disconnected'}
      />

      <span class="text-xs text-muted-foreground">
        {connected ? `Online (${users.length})` : 'Connecting...'}
      </span>

      {/* User avatars */}
      {users.length > 0 && (
        <div class="flex -space-x-2 ml-auto">
          {users.slice(0, 5).map((user) => (
            <Avatar
              key={user.userId}
              className="h-6 w-6 border-2 border-background"
            >
              <AvatarFallback
                className="text-[10px] text-white font-medium"
                style={{ backgroundColor: user.color }}
              >
                {user.userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
          {users.length > 5 && (
            <div class="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
              <span class="text-[10px] text-muted-foreground">
                +{users.length - 5}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
