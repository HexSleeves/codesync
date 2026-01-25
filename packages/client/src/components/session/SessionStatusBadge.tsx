import { Badge } from '@/components/ui';

const statusVariants: Record<string, 'secondary' | 'warning' | 'success' | 'default'> = {
  draft: 'secondary',
  in_review: 'warning',
  approved: 'success',
  merged: 'default',
};

interface SessionStatusBadgeProps {
  status: string;
}

export function SessionStatusBadge({ status }: SessionStatusBadgeProps) {
  return (
    <Badge variant={statusVariants[status] || 'secondary'}>
      {status.replace('_', ' ')}
    </Badge>
  );
}
