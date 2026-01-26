/**
 * UserDropdown - Avatar-based dropdown menu for user actions
 * Contains GitHub connection status, settings, and logout
 */

import { Avatar, AvatarFallback, Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from '@/components/ui';
import { GitHubIcon, LogOutIcon } from '@/components/icons';

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
  const initials = getInitials(name || email);
  const displayName = name || githubUsername || email.split('@')[0];

  return (
    <Dropdown
      align="end"
      trigger={
        <button
          type="button"
          className="flex items-center gap-2 rounded-full hover:bg-accent p-0.5 pr-2"
          aria-label="User menu"
        >
          <Avatar className="size-8">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-foreground hidden sm:block max-w-24 truncate">
            {displayName}
          </span>
        </button>
      }
    >
      <DropdownLabel>
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{displayName}</span>
          <span className="text-xs text-muted-foreground">{email}</span>
        </div>
      </DropdownLabel>
      <DropdownSeparator />

      {/* GitHub Connection Status */}
      {githubConnected ? (
        <>
          <div className="px-2 py-1.5 flex items-center gap-2 text-sm">
            <GitHubIcon className="size-4" />
            <span className="text-muted-foreground">@{githubUsername}</span>
          </div>
          {onDisconnectGitHub && (
            <DropdownItem onClick={onDisconnectGitHub}>
              <GitHubIcon className="size-4" />
              Disconnect GitHub
            </DropdownItem>
          )}
        </>
      ) : (
        onConnectGitHub && (
          <DropdownItem onClick={onConnectGitHub}>
            <GitHubIcon className="size-4" />
            Connect GitHub
          </DropdownItem>
        )
      )}

      <DropdownSeparator />
      <DropdownItem onClick={onLogout} destructive>
        <LogOutIcon className="size-4" />
        Sign out
      </DropdownItem>
    </Dropdown>
  );
}

function getInitials(name: string): string {
  const parts = name.split(/[@.\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
