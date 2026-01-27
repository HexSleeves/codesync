/**
 * Share Session Modal - Generate and manage shareable session links
 */

import { useState } from 'hono/jsx';
import { apiCall } from '@/api/client';
import { CheckIcon, CopyIcon, LinkIcon } from '@/components/icons';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  toast,
} from '@/components/ui';

interface ShareSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  shareToken: string | null;
  onShareTokenChange: (token: string | null) => void;
}

export function ShareSessionModal({
  open,
  onOpenChange,
  sessionId,
  shareToken,
  onShareTokenChange,
}: ShareSessionModalProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = shareToken ? `${window.location.origin}/shared/${shareToken}` : null;

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const response = await apiCall<{ shareToken: string }>(
        'POST',
        `/sessions/${sessionId}/share`
      );
      onShareTokenChange(response.shareToken);
      toast.success('Share link generated!');
    } catch (err) {
      console.error('Failed to generate share link:', err);
      toast.error('Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeLink = async () => {
    setLoading(true);
    try {
      await apiCall<{ success: boolean }>('DELETE', `/sessions/${sessionId}/share`);
      onShareTokenChange(null);
      toast.success('Share link revoked');
    } catch (err) {
      console.error('Failed to revoke share link:', err);
      toast.error('Failed to revoke share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      toast.error('Failed to copy link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Session</DialogTitle>
          <DialogDescription>
            Share this session with others using a public link. Anyone with the link can view the
            session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {shareToken ? (
            <>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={shareUrl || ''}
                    readOnly
                    className="pl-9 pr-10 text-sm font-mono bg-muted"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={handleCopyLink} className="shrink-0">
                  {copied ? (
                    <CheckIcon className="size-4 text-green-500" />
                  ) : (
                    <CopyIcon className="size-4" />
                  )}
                </Button>
              </div>

              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Note:</span> Anyone with this link
                  can view the session content, comments, and chat history in read-only mode.
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <LinkIcon className="mx-auto size-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                No share link has been generated yet.
              </p>
              <Button onClick={handleGenerateLink} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Share Link'}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {shareToken && (
            <Button variant="destructive" onClick={handleRevokeLink} disabled={loading}>
              {loading ? 'Revoking...' : 'Revoke Link'}
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
