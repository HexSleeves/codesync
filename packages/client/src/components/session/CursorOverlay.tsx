/**
 * Cursor overlay component
 * Shows other users' cursor positions on code lines
 */

import type { CursorMessage } from '@codesync/shared';

interface CursorOverlayProps {
  cursors: Map<string, CursorMessage>;
  currentFileId: string | null;
  currentUserId?: string;
  lineHeight?: number;
}

export function CursorOverlay({
  cursors,
  currentFileId,
  currentUserId,
  lineHeight = 20,
}: CursorOverlayProps) {
  // Filter cursors for current file, excluding current user
  const fileCursors = Array.from(cursors.values()).filter(
    (c) => c.fileId === currentFileId && c.userId !== currentUserId
  );

  if (fileCursors.length === 0) return null;

  return (
    <div class="absolute inset-0 pointer-events-none z-10">
      {fileCursors.map((cursor) => (
        <div
          key={cursor.userId}
          class="absolute flex items-center transition-all duration-150"
          style={{
            top: `${(cursor.line - 1) * lineHeight}px`,
            left: '0',
          }}
        >
          {/* Cursor line */}
          <div class="w-0.5 h-5 rounded-full" style={{ backgroundColor: cursor.color }} />
          {/* User name tag */}
          <span
            class="text-[10px] px-1.5 py-0.5 rounded-r ml-0 text-white whitespace-nowrap"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.userName}
          </span>
        </div>
      ))}
    </div>
  );
}
