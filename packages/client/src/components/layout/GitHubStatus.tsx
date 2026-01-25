import { GitHubIcon } from '@/components/icons';
import { Button } from '@/components/ui';

interface GitHubStatusProps {
  connected: boolean;
  username: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function GitHubStatus({ connected, username, onConnect, onDisconnect }: GitHubStatusProps) {
  if (connected && username) {
    return (
      <div className="flex items-center gap-1 sm:gap-2">
        <GitHubIcon className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-green-400 text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">
          @{username}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDisconnect}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
          title="Disconnect GitHub"
        >
          ✕
        </Button>
      </div>
    );
  }

  return (
    <Button variant="secondary" size="sm" onClick={onConnect} className="text-xs sm:text-sm whitespace-nowrap">
      <GitHubIcon className="w-4 h-4 mr-1 sm:mr-2 shrink-0" />
      <span className="hidden sm:inline">Connect GitHub</span>
      <span className="sm:hidden">GitHub</span>
    </Button>
  );
}
