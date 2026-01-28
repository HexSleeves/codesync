# Plan 003: GitHub Review Sync (One-Way Push)

**Status**: 🟢 Complete
**Created**: Jan 27, 2026
**Completed**: Jan 28, 2026
**Estimated**: 4-6 hours
**Actual**: ~3 hours
**Priority**: Medium

---

## Executive Summary

Add ability to push CodeSync reviews to GitHub PRs. Users can review in CodeSync's collaborative environment, then submit their review (comments + approval status) to GitHub with a single click.

## Success Criteria

- [ ] "Submit to GitHub" button appears for GitHub-imported sessions
- [ ] Line comments are posted as PR review comments at correct positions
- [ ] Session approval status maps to GitHub review status
- [ ] Comments are marked as "synced" to prevent duplicates
- [ ] Errors are handled gracefully (rate limits, permissions)

---

## Design Decisions

### Sync Strategy: One-Way Push

```
CodeSync ──────► GitHub
(no sync back)
```

- User explicitly triggers sync via "Submit to GitHub" button
- No automatic sync, no background jobs
- No pulling GitHub comments back (out of scope)

### Comment Mapping

| CodeSync | GitHub PR Review |
|----------|------------------|
| Line comment | Review comment on diff (requires `commit_id`, `path`, `line`) |
| General comment | Review body text |
| Resolved comment | Skip (don't post) or post with ~~strikethrough~~ |

### Status Mapping

| CodeSync Status | GitHub Review Action |
|-----------------|---------------------|
| `approved` | `APPROVE` |
| `in_review` + Request Changes clicked | `REQUEST_CHANGES` |
| `in_review` (no action) | `COMMENT` (neutral) |
| `draft` | Don't allow submit |
| `merged` | Don't allow submit (PR already merged) |

### Data Model Changes

```typescript
// Add to comments table
interface Comment {
  // ... existing fields
  githubCommentId?: string;  // GitHub's comment ID after sync
  syncedAt?: Date;           // When it was synced
}

// Add to sessions table
interface Session {
  // ... existing fields
  githubReviewId?: string;   // GitHub review ID after submission
  githubSyncedAt?: Date;     // Last sync timestamp
}
```

---

## Implementation Plan

### Phase 1: Database Schema (30 min)

#### 1.1 Add sync tracking columns

**File**: `packages/api/src/db/schema.ts`

```typescript
// Add to comments table
githubCommentId: text('github_comment_id'),
syncedAt: timestamp('synced_at'),

// Add to sessions table
githubReviewId: text('github_review_id'),
githubSyncedAt: timestamp('github_synced_at'),
```

#### 1.2 Run migration

```bash
bun run db:generate
bun run db:migrate
```

#### 1.3 Update shared types

**File**: `packages/shared/src/types.ts`

```typescript
interface Comment {
  // ... existing
  githubCommentId: string | null;
  syncedAt: Date | null;
}

interface Session {
  // ... existing
  githubReviewId: string | null;
  githubSyncedAt: Date | null;
}
```

---

### Phase 2: GitHub API Service (1.5 hours)

#### 2.1 Create GitHub review service

**File**: `packages/api/src/services/github/review-sync.ts`

```typescript
import { Octokit } from '@octokit/rest';

interface ReviewComment {
  path: string;        // File path
  line: number;        // Line number in diff
  body: string;        // Comment text
  side?: 'LEFT' | 'RIGHT';  // Which side of diff
}

interface SubmitReviewParams {
  accessToken: string;
  owner: string;
  repo: string;
  prNumber: number;
  commitSha: string;
  event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
  body?: string;       // Overall review comment
  comments: ReviewComment[];
}

export async function submitGitHubReview(params: SubmitReviewParams) {
  const octokit = new Octokit({ auth: params.accessToken });

  // Create a pending review with comments
  const { data: review } = await octokit.pulls.createReview({
    owner: params.owner,
    repo: params.repo,
    pull_number: params.prNumber,
    commit_id: params.commitSha,
    event: params.event,
    body: params.body,
    comments: params.comments.map(c => ({
      path: c.path,
      line: c.line,
      body: c.body,
      side: c.side || 'RIGHT',
    })),
  });

  return review;
}
```

#### 2.2 Handle diff line mapping

GitHub requires the line number in the **diff**, not the file. Need to map:

- CodeSync `lineNumber` (line in new file) → GitHub `line` (position in diff)

**File**: `packages/api/src/services/github/diff-mapper.ts`

```typescript
/**
 * Map a file line number to a diff position
 * GitHub API requires the position in the diff, not the file
 */
export function mapLineToDiffPosition(
  hunks: DiffHunk[],
  lineNumber: number,
  side: 'old' | 'new'
): number | null {
  let position = 0;

  for (const hunk of hunks) {
    position++; // Hunk header line (@@ -x,y +a,b @@)

    for (const line of hunk.lines) {
      position++;

      if (side === 'new' && line.newLineNumber === lineNumber) {
        return position;
      }
      if (side === 'old' && line.oldLineNumber === lineNumber) {
        return position;
      }
    }
  }

  return null; // Line not in diff
}
```

---

### Phase 3: API Endpoint (1 hour)

#### 3.1 Create submit review endpoint

**File**: `packages/api/src/routes/github/sync.ts`

```typescript
import { Hono } from 'hono';
import { submitGitHubReview } from '../../services/github/review-sync';
import { mapLineToDiffPosition } from '../../services/github/diff-mapper';

export const githubSyncRoutes = new Hono()
  .post('/sessions/:id/submit-review', authMiddleware, async (c) => {
    const { id } = c.req.param();
    const userId = c.get('userId');

    // 1. Get session with GitHub source info
    const session = await getSession(id);
    if (!session.source?.type === 'github') {
      return c.json({ error: 'Session not imported from GitHub' }, 400);
    }

    // 2. Get user's GitHub token
    const user = await getUser(userId);
    if (!user.githubAccessToken) {
      return c.json({ error: 'GitHub not connected' }, 400);
    }

    // 3. Validate session status
    if (session.status === 'draft') {
      return c.json({ error: 'Start review before submitting' }, 400);
    }
    if (session.status === 'merged') {
      return c.json({ error: 'PR already merged' }, 400);
    }

    // 4. Get unsynced comments
    const comments = await getUnsyncedComments(id);

    // 5. Get files for diff mapping
    const files = await getSessionFiles(id);

    // 6. Map comments to GitHub format
    const reviewComments = [];
    for (const comment of comments) {
      const file = files.find(f => f.id === comment.fileId);
      if (!file || !comment.lineNumber) continue;

      const position = mapLineToDiffPosition(
        file.hunks,
        comment.lineNumber,
        'new'
      );

      if (position) {
        reviewComments.push({
          path: file.path,
          line: position,
          body: comment.text,
        });
      }
    }

    // 7. Determine review event
    let event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT' = 'COMMENT';
    if (session.status === 'approved') {
      event = 'APPROVE';
    }
    // Could add REQUEST_CHANGES based on a flag

    // 8. Submit to GitHub
    const review = await submitGitHubReview({
      accessToken: user.githubAccessToken,
      owner: session.source.repository!.split('/')[0],
      repo: session.source.repository!.split('/')[1],
      prNumber: session.source.prNumber!,
      commitSha: session.source.commit!,
      event,
      comments: reviewComments,
    });

    // 9. Mark comments as synced
    await markCommentsSynced(comments.map(c => c.id));

    // 10. Update session with review ID
    await updateSession(id, {
      githubReviewId: String(review.id),
      githubSyncedAt: new Date(),
    });

    return c.json({
      success: true,
      reviewId: review.id,
      reviewUrl: review.html_url,
      commentsSynced: reviewComments.length,
    });
  });
```

#### 3.2 Add to app routes

**File**: `packages/api/src/app.ts`

```typescript
import { githubSyncRoutes } from './routes/github/sync';

app.route('/api/github', githubSyncRoutes);
```

---

### Phase 4: Frontend UI (1.5 hours)

#### 4.1 Create SubmitReviewButton component

**File**: `packages/client/src/components/session/SubmitReviewButton.tsx`

```typescript
import { useState } from 'hono/jsx';
import { Button, Dialog, DialogContent, ... } from '@/components/ui';
import { GitHubIcon } from '@/components/icons';

interface SubmitReviewButtonProps {
  session: Session;
  unsyncedCommentCount: number;
  onSubmit: () => Promise<void>;
  disabled?: boolean;
}

export function SubmitReviewButton({
  session,
  unsyncedCommentCount,
  onSubmit,
  disabled,
}: SubmitReviewButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Don't show for non-GitHub sessions
  if (session.source?.type !== 'github') return null;

  // Don't allow for draft or merged
  if (session.status === 'draft' || session.status === 'merged') {
    return null;
  }

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit();
      toast.success('Review submitted to GitHub!');
      setShowConfirm(false);
    } catch (err) {
      toast.error('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const reviewAction = session.status === 'approved' ? 'Approve' : 'Comment';

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
        <span className="hidden lg:inline">Submit to GitHub</span>
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Review to GitHub</DialogTitle>
            <DialogDescription>
              This will post your review to the GitHub PR.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Action:</span>
              <span className="font-medium">{reviewAction}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Comments to post:</span>
              <span className="font-medium">{unsyncedCommentCount}</span>
            </div>
            {session.githubSyncedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last synced:</span>
                <span>{formatDate(session.githubSyncedAt)}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <Spinner /> : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

#### 4.2 Add to SessionControls

**File**: `packages/client/src/components/session/SessionControls.tsx`

```typescript
import { SubmitReviewButton } from './SubmitReviewButton';

// In the component:
<SubmitReviewButton
  session={session}
  unsyncedCommentCount={unsyncedCommentCount}
  onSubmit={handleSubmitToGitHub}
/>
```

#### 4.3 Add hook for submitting

**File**: `packages/client/src/hooks/useGitHubSync.ts`

```typescript
export function useGitHubSync(sessionId: string) {
  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiCall('POST', `/github/sessions/${sessionId}/submit-review`);
    },
    onSuccess: () => {
      // Invalidate comments to show synced status
      invalidateQueries(['comments', sessionId]);
      invalidateQueries(['session', sessionId]);
    },
  });

  return {
    submitToGitHub: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
  };
}
```

---

### Phase 5: UI Indicators (30 min)

#### 5.1 Show sync status on comments

Add indicator showing if comment has been synced to GitHub.

**File**: `packages/client/src/components/comment/CommentCard.tsx`

```typescript
{comment.syncedAt && (
  <span className="text-xs text-muted-foreground" title={`Synced ${formatDate(comment.syncedAt)}`}>
    <GitHubIcon className="size-3 inline" /> Synced
  </span>
)}
```

#### 5.2 Show last sync time on session

In SessionControls or header, show when last synced.

---

### Phase 6: Error Handling (30 min)

#### 6.1 Handle common errors

- **401 Unauthorized**: Token expired, prompt to reconnect GitHub
- **403 Forbidden**: No write access to repo
- **404 Not Found**: PR was closed/deleted
- **422 Unprocessable**: Invalid diff position (line not in diff)
- **Rate Limit**: Show friendly message, suggest waiting

#### 6.2 Partial success handling

If some comments fail to post:

- Still submit the review with successful comments
- Mark only successful comments as synced
- Show warning with count of failed comments

---

## File Changes Summary

### New Files

| File | Purpose |
|------|--------|
| `api/services/github/review-sync.ts` | GitHub review submission logic |
| `api/services/github/diff-mapper.ts` | Map line numbers to diff positions |
| `api/routes/github/sync.ts` | Submit review endpoint |
| `client/components/session/SubmitReviewButton.tsx` | UI for submitting |
| `client/hooks/useGitHubSync.ts` | Hook for sync mutations |

### Modified Files

| File | Changes |
|------|--------|
| `api/db/schema.ts` | Add sync tracking columns |
| `shared/types.ts` | Add sync fields to types |
| `client/components/session/SessionControls.tsx` | Add submit button |
| `client/components/comment/CommentCard.tsx` | Show sync indicator |

---

## Testing Checklist

### Happy Path

- [ ] Import PR from GitHub
- [ ] Add comments on various lines
- [ ] Approve session
- [ ] Click "Submit to GitHub"
- [ ] Verify comments appear on PR
- [ ] Verify PR shows as approved
- [ ] Verify comments marked as synced in CodeSync

### Edge Cases

- [ ] Submit with no comments (just approval)
- [ ] Comment on line not in diff (should skip gracefully)
- [ ] Submit same review twice (should only post new comments)
- [ ] Resolved comments (should skip)
- [ ] Very long comment text
- [ ] Special characters in comments

### Error Cases

- [ ] GitHub token expired
- [ ] No write permission to repo
- [ ] PR already merged
- [ ] PR closed
- [ ] Rate limited
- [ ] Network error

---

## Future Enhancements (Out of Scope)

1. **Two-way sync**: Pull GitHub comments into CodeSync
2. **Real-time sync**: Auto-submit on approve
3. **Request Changes**: Add explicit "Request Changes" action
4. **Suggested changes**: Support GitHub's suggestion syntax
5. **Reply threads**: Sync threaded discussions
6. **Reactions**: Sync emoji reactions

---

## Security Considerations

1. **Token scope**: Needs `repo` scope for private repos, `public_repo` for public
2. **Token storage**: Already encrypted at rest (existing implementation)
3. **User verification**: Only user's own token is used
4. **Audit trail**: Log all sync operations

---

## Implementation Order

1. **Database changes** (30 min) - Foundation
2. **Diff mapper utility** (30 min) - Needed for comments
3. **GitHub review service** (1 hour) - Core logic
4. **API endpoint** (1 hour) - Wire it up
5. **Frontend UI** (1.5 hours) - Button + dialog
6. **Error handling** (30 min) - Polish

Total: ~5 hours
