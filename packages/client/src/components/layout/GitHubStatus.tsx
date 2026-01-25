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
      <div className="flex items-center gap-2">
        <GitHubIcon className="w-4 h-4 text-muted-foreground" />
        <span className="text-green-400 text-sm">@{username}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDisconnect}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          title="Disconnect GitHub"
        >
          ✕
        </Button>
      </div>
    );
  }

  return (
    <Button variant="secondary" size="sm" onClick={onConnect}>
      <GitHubIcon className="w-4 h-4 mr-2" />
      Connect GitHub
    </Button>
  );
}
