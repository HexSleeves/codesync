import type { Child } from 'hono/jsx';
import { Button, Card, CardContent } from '@/components/ui';

interface EmptyStateProps {
  icon?: Child;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card className="text-center py-12">
      <CardContent>
        {icon && <div className="text-4xl mb-4">{icon}</div>}
        <p className="text-muted-foreground mb-2">{title}</p>
        {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
        {actionLabel && onAction && (
          <Button variant="link" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
