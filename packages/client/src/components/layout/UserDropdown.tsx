/**
 * UserDropdown - Avatar-based dropdown menu for user actions
 * Contains GitHub connection status, settings, and logout
 */

import { useState } from 'hono/jsx';
import { GitHubIcon, LogOutIcon, SettingsIcon } from '@/components/icons';
import { SettingsModal } from '@/components/modals/SettingsModal';
import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';

interface UserDropdownProps {
  email: string;
  name?: string;
  githubUsername?: string;
  githubConnected?: boolean;
  onLogout: () => void;
  onConnectGitHub?: () => void;
  onDisconnectGitHub?: () => void;
}

export function UserDropdown({
  email,
  name,
  githubUsername,
  githubConnected,
  onLogout,
  onConnectGitHub,
  onDisconnectGitHub,
}: UserDropdownProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const initials = getInitials(name || email);
  const displayName = name || githubUsername || email.split('@')[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full hover:bg-accent p-0.5 pr-2">
        <Avatar className="size-8">
          <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>
        <span className="text-sm text-foreground hidden sm:block max-w-24 truncate">
          {displayName}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{displayName}</span>
            <span className="text-xs text-muted-foreground font-normal">{email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* GitHub Connection Status */}
        {githubConnected ? (
          <>
            <div className="px-2 py-1.5 flex items-center gap-2 text-sm">
              <GitHubIcon className="size-4" />
              <span className="text-muted-foreground">@{githubUsername}</span>
            </div>
            {onDisconnectGitHub && (
              <DropdownMenuItem onSelect={onDisconnectGitHub}>
                <GitHubIcon className="size-4" />
                Disconnect GitHub
              </DropdownMenuItem>
            )}
          </>
        ) : (
          onConnectGitHub && (
            <DropdownMenuItem onSelect={onConnectGitHub}>
              <GitHubIcon className="size-4" />
              Connect GitHub
            </DropdownMenuItem>
          )
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
          <SettingsIcon className="size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onLogout} destructive>
          <LogOutIcon className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </DropdownMenu>
  );
}

function getInitials(name: string): string {
  const parts = name.split(/[@.\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
