import type { SessionStatus } from '@codesync/shared';
import { cn } from '@/lib/utils';

const statusConfig: Record<
  SessionStatus,
  { label: string; dotColor: string; bgColor: string; textColor: string }
> = {
  draft: {
    label: 'Draft',
    dotColor: 'bg-gray-400',
    bgColor: 'bg-gray-400/10',
    textColor: 'text-gray-400',
  },
  in_review: {
    label: 'In Review',
    dotColor: 'bg-amber-400',
    bgColor: 'bg-amber-400/10',
    textColor: 'text-amber-400',
  },
  approved: {
    label: 'Approved',
    dotColor: 'bg-emerald-400',
    bgColor: 'bg-emerald-400/10',
    textColor: 'text-emerald-400',
  },
  merged: {
    label: 'Merged',
    dotColor: 'bg-purple-400',
    bgColor: 'bg-purple-400/10',
    textColor: 'text-purple-400',
  },
};

interface SessionStatusBadgeProps {
  status: SessionStatus;
  className?: string;
}

export function SessionStatusBadge({ status, className }: SessionStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium',
        config.bgColor,
        config.textColor,
        className
      )}
    >
      <span className={cn('size-1.5 rounded-full', config.dotColor)} />
      {config.label}
    </span>
  );
}
