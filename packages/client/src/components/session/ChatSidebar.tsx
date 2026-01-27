/**
 * Chat Sidebar - Real-time chat panel
 * Used in Session page for collaborative discussions
 */

import type { WSChatMessage } from '@codesync/shared';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatPanel } from './ChatPanel';

interface ChatSidebarProps {
  /** Whether the sidebar is visible */
  open: boolean;
  /** Callback when sidebar should close */
  onClose: () => void;
  /** Chat messages */
  messages: WSChatMessage[];
  /** Callback to send a message */
  onSend: (text: string) => void;
  /** WebSocket connection status */
  connected: boolean;
}

export function ChatSidebar({ open, onClose, messages, onSend, connected }: ChatSidebarProps) {
  return (
    <Sidebar open={open} onClose={onClose} side="right" title="Chat" width="w-full sm:w-72">
      <div className="flex-1 overflow-hidden">
        <ChatPanel messages={messages} onSend={onSend} connected={connected} />
      </div>
    </Sidebar>
  );
}
