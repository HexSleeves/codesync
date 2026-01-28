import type { SessionStatus } from '@codesync/shared';
import { Badge } from '@/components/ui';

const statusConfig: Record<
  SessionStatus,
  { label: string; variant: 'secondary' | 'warning' | 'success' | 'default' }
> = {
  draft: { label: 'Draft', variant: 'secondary' },
  in_review: { label: 'In Review', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  merged: { label: 'Merged', variant: 'default' },
};

interface SessionStatusBadgeProps {
  status: SessionStatus;
  className?: string;
}

export function SessionStatusBadge({ status, className }: SessionStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
