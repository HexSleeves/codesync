import type { Session } from '@codesync/shared';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader } from '@/components/ui';
import { Link } from '@/router';
import { SessionStatusBadge } from './SessionStatusBadge';

interface SessionCardProps {
  session: Session;
  onDelete: () => void;
}

export function SessionCard({ session, onDelete }: SessionCardProps) {
  return (
    <Card className="hover:bg-accent/50 transition-colors overflow-hidden">
      <CardHeader className="pb-2 space-y-2">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <Link
            href={`/session/${session.id}`}
            className="text-base sm:text-lg font-medium text-foreground hover:text-primary truncate min-w-0 flex-1"
          >
            {session.title}
          </Link>
          <SessionStatusBadge status={session.status} className="shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {session.description && (
          <CardDescription className="line-clamp-2 mb-3 text-sm">
            {session.description}
          </CardDescription>
        )}
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
          <span>{new Date(session.createdAt).toLocaleDateString()}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive h-8 px-2 sm:px-3"
            onClick={(e) => {
              e.preventDefault();
              if (confirm('Delete this session?')) onDelete();
            }}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
