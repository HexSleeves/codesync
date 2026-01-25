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
    <Card className="hover:bg-accent/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <Link
            href={`/session/${session.id}`}
            className="text-lg font-medium text-foreground hover:text-primary"
          >
            {session.title}
          </Link>
          <SessionStatusBadge status={session.status} />
        </div>
      </CardHeader>
      <CardContent>
        {session.description && (
          <CardDescription className="line-clamp-2 mb-3">{session.description}</CardDescription>
        )}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{new Date(session.createdAt).toLocaleDateString()}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
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
