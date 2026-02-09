/**
 * Chat panel component - Premium glass morphism design
 * Real-time chat for session participants
 */

import type { WSChatMessage } from '@codesync/shared';
import { useEffect, useRef } from 'hono/jsx';
import { useForm } from '@/lib/form';
import { Button, Input } from '../ui';

interface ChatFormValues {
  message: string;
}

interface ChatPanelProps {
  messages: WSChatMessage[];
  onSend: (text: string) => void;
  connected: boolean;
}

export function ChatPanel({ messages, onSend, connected }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const form = useForm<ChatFormValues>({
    defaultValues: {
      message: '',
    },
    onSubmit: async ({ value }) => {
      if (value.message.trim() && connected) {
        onSend(value.message.trim());
        form.reset();
      }
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div class="flex flex-col h-full">
      {/* Messages */}
      <div class="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div class="flex flex-col items-center justify-center py-8 text-center">
            <svg class="size-8 text-muted-foreground/20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p class="text-xs text-muted-foreground/60">
              No messages yet
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} class="text-sm group">
              <div class="flex items-baseline gap-2">
                <span class="font-medium text-xs" style={{ color: msg.color }}>
                  {msg.userName}
                </span>
                <span class="text-[10px] text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
              <p class="text-foreground/90 mt-0.5 break-words leading-relaxed">{msg.text}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        class="p-3 border-t border-border/50 flex gap-2"
      >
        <Input
          placeholder={connected ? 'Type a message...' : 'Connecting...'}
          disabled={!connected}
          className="flex-1 text-sm h-9 rounded-lg bg-background/50 border-border/50 placeholder:text-muted-foreground/40"
          {...form.getFieldProps('message')}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!connected || !form.values.message.trim()}
          className="rounded-lg h-9 bg-primary hover:bg-primary/90"
        >
          <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </Button>
      </form>
    </div>
  );
}
