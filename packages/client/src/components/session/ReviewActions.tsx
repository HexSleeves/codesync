/**
 * Review Actions - Status transition buttons for session workflow
 * Shows appropriate actions based on current session status
 */

import type { Session, SessionStatus, User } from '@codesync/shared';
import { useState } from 'hono/jsx';
import { CheckIcon, CloseIcon } from '@/components/icons';
import { Button, Spinner, toast } from '@/components/ui';
import { apiCall } from '@/api/client';

interface ReviewActionsProps {
  session: Session;
  /** Callback when status changes */
  onStatusChange: (session: Session) => void;
  /** Current user ID (to check if user is owner) */
  currentUserId?: string;
}

// Status display info
const statusInfo: Record<SessionStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'text-muted-foreground' },
  in_review: { label: 'In Review', color: 'text-amber-500' },
  approved: { label: 'Approved', color: 'text-green-500' },
  merged: { label: 'Merged', color: 'text-blue-500' },
};

// Available actions per status
const statusActions: Record<SessionStatus, { status: SessionStatus; label: string; variant: 'default' | 'secondary' | 'destructive' }[]> = {
  draft: [
    { status: 'in_review', label: 'Start Review', variant: 'default' },
  ],
  in_review: [
    { status: 'approved', label: 'Approve', variant: 'default' },
    { status: 'draft', label: 'Request Changes', variant: 'secondary' },
  ],
  approved: [
    { status: 'merged', label: 'Mark Merged', variant: 'default' },
    { status: 'in_review', label: 'Reopen Review', variant: 'secondary' },
  ],
  merged: [
    { status: 'approved', label: 'Unmerge', variant: 'secondary' },
  ],
};

export function ReviewActions({ session, onStatusChange, currentUserId }: ReviewActionsProps) {
  const [loading, setLoading] = useState(false);

  const actions = statusActions[session.status] || [];
  const isOwner = session.createdBy === currentUserId;

  const handleStatusChange = async (newStatus: SessionStatus) => {
    setLoading(true);
    try {
      const { session: updatedSession } = await apiCall<{ session: Session }>(
        'PATCH',
        `/sessions/${session.id}/status`,
        { status: newStatus }
      );
      onStatusChange(updatedSession);
      toast.success(`Session ${statusInfo[newStatus].label.toLowerCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Status info */}
      <StatusInfo session={session} />

      {/* Action buttons */}
      {actions.map((action) => (
        <Button
          key={action.status}
          variant={action.variant}
          size="sm"
          onClick={() => handleStatusChange(action.status)}
          disabled={loading}
          className="gap-1.5"
        >
          {loading ? (
            <Spinner size="sm" />
          ) : action.status === 'approved' ? (
            <CheckIcon className="size-4" />
          ) : action.status === 'draft' ? (
            <CloseIcon className="size-4" />
          ) : null}
          <span className="hidden sm:inline">{action.label}</span>
          <span className="sm:hidden">
            {action.label.split(' ')[0]}
          </span>
        </Button>
      ))}
    </div>
  );
}

/**
 * Status Info - Shows who/when for status changes
 */
function StatusInfo({ session }: { session: Session }) {
  const { status, reviewer, approver, merger, reviewStartedAt, approvedAt, mergedAt } = session;

  const formatDate = (date: Date | string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserName = (user: User | null | undefined) => {
    if (!user) return 'Unknown';
    return user.name || user.email.split('@')[0];
  };

  // Show most relevant info based on status
  let info: { by: string; at: string } | null = null;

  if (status === 'merged' && merger) {
    info = { by: getUserName(merger), at: formatDate(mergedAt) };
  } else if (status === 'approved' && approver) {
    info = { by: getUserName(approver), at: formatDate(approvedAt) };
  } else if (status === 'in_review' && reviewer) {
    info = { by: getUserName(reviewer), at: formatDate(reviewStartedAt) };
  }

  if (!info) return null;

  return (
    <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
      <span>by {info.by}</span>
      <span className="text-border">•</span>
      <span>{info.at}</span>
    </div>
  );
}
