import type { Child } from 'hono/jsx';
import { Button } from '@/components/ui';

interface EmptyStateProps {
  icon?: Child;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
      {icon && <div className="mb-5">{icon}</div>}
      <p className="text-lg font-medium text-foreground/80 mb-2">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="rounded-lg bg-primary hover:bg-primary/90 glow-sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
