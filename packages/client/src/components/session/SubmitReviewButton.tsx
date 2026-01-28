/**
 * Submit Review to GitHub Button
 * Allows users to push their CodeSync review to the GitHub PR
 */

import type { Session } from '@codesync/shared';
import { useState } from 'hono/jsx';
import { apiCall } from '@/api/client';
import { GitHubIcon } from '@/components/icons';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
  toast,
} from '@/components/ui';

interface SubmitReviewButtonProps {
  /** Session object */
  session: Session;
  /** Count of comments not yet synced to GitHub */
  unsyncedCommentCount: number;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Callback when review is successfully submitted */
  onSuccess?: (result: SubmitReviewResult) => void;
}

interface SubmitReviewResult {
  success: boolean;
  reviewId: number;
  reviewUrl: string;
  reviewState: string;
  commentsSynced: number;
  commentsSkipped: number;
}

export function SubmitReviewButton({
  session,
  unsyncedCommentCount,
  disabled,
  onSuccess,
}: SubmitReviewButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Don't show for non-GitHub sessions
  if (session.source?.type !== 'github') {
    return null;
  }

  // Don't allow for draft sessions
  if (session.status === 'draft') {
    return null;
  }

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await apiCall<SubmitReviewResult>(
        'POST',
        `/github/sessions/${session.id}/submit-review`
      );

      if (result.success) {
        const message =
          result.commentsSynced > 0
            ? `Review submitted with ${result.commentsSynced} comment(s)!`
            : 'Review submitted to GitHub!';

        toast.success(message);

        if (result.commentsSkipped > 0) {
          toast.warning(
            `${result.commentsSkipped} comment(s) couldn't be synced (line not in diff)`
          );
        }

        setShowConfirm(false);
        onSuccess?.(result);
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
      const message = err instanceof Error ? err.message : 'Failed to submit review to GitHub';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Determine the review action based on session status
  const getReviewAction = () => {
    switch (session.status) {
      case 'approved':
        return 'Approve';
      case 'merged':
        return 'Comment (already merged)';
      default:
        return 'Comment';
    }
  };

  // Check if already synced
  const isAlreadySynced = !!session.githubSyncedAt;
  const lastSyncedAt = session.githubSyncedAt ? new Date(session.githubSyncedAt) : null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={disabled}
        className="gap-1.5"
      >
        <GitHubIcon className="size-4" />
        <span className="hidden lg:inline">
          {isAlreadySynced ? 'Update on GitHub' : 'Submit to GitHub'}
        </span>
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Review to GitHub</DialogTitle>
            <DialogDescription>
              This will post your review to the GitHub pull request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {/* PR Info */}
            <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Repository:</span>
                <span className="font-medium">{session.source.repository}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">PR Number:</span>
                <span className="font-medium">#{session.source.prNumber}</span>
              </div>
            </div>

            {/* Review Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Review Action:</span>
                <span className="font-medium">{getReviewAction()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Comments to sync:</span>
                <span className="font-medium">{unsyncedCommentCount}</span>
              </div>
              {lastSyncedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last synced:</span>
                  <span className="text-muted-foreground">
                    {lastSyncedAt.toLocaleDateString()} {lastSyncedAt.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>

            {/* Warning for approved sessions */}
            {session.status === 'approved' && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                <p className="text-sm text-green-400">
                  ✅ This will <strong>approve</strong> the pull request on GitHub.
                </p>
              </div>
            )}

            {/* Info about skipped comments */}
            {unsyncedCommentCount === 0 && !isAlreadySynced && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                <p className="text-sm text-amber-400">
                  No new comments to sync. The review action will still be submitted.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowConfirm(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="gap-2">
              {loading && <Spinner size="sm" />}
              {loading ? 'Submitting...' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
