/**
 * Chat panel component
 * Real-time chat for session participants
 */

import type { WSChatMessage } from '@codesync/shared';
import { useEffect, useRef, useState } from 'hono/jsx';
import { Button, Input } from '../ui';

interface ChatPanelProps {
  messages: WSChatMessage[];
  onSend: (text: string) => void;
  connected: boolean;
}

export function ChatPanel({ messages, onSend, connected }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (input.trim() && connected) {
      onSend(input.trim());
      setInput('');
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div class="flex flex-col h-full">
      {/* Header */}
      <div class="px-3 py-2 border-b border-border">
        <h3 class="text-sm font-medium">Chat</h3>
      </div>

      {/* Messages */}
      <div class="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <p class="text-xs text-muted-foreground text-center py-4">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} class="text-sm">
              <div class="flex items-baseline gap-2">
                <span
                  class="font-medium text-xs"
                  style={{ color: msg.color }}
                >
                  {msg.userName}
                </span>
                <span class="text-[10px] text-muted-foreground">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
              <p class="text-foreground mt-0.5 break-words">{msg.text}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        class="p-3 border-t border-border flex gap-2"
      >
        <Input
          value={input}
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
          placeholder={connected ? 'Type a message...' : 'Connecting...'}
          disabled={!connected}
          className="flex-1 text-sm"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!connected || !input.trim()}
        >
          Send
        </Button>
      </form>
    </div>
  );
}
