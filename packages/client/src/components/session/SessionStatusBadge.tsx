import { Badge } from '@/components/ui';

const statusVariants: Record<string, 'secondary' | 'warning' | 'success' | 'default'> = {
  draft: 'secondary',
  in_review: 'warning',
  approved: 'success',
  merged: 'default',
};

interface SessionStatusBadgeProps {
  status: string;
  className?: string;
}

export function SessionStatusBadge({ status, className }: SessionStatusBadgeProps) {
  return (
    <Badge variant={statusVariants[status] || 'secondary'} className={className}>
      {status.replace('_', ' ')}
    </Badge>
  );
}
