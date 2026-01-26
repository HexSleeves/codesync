/**
 * Chat panel component - uses TanStack Form
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
          <p class="text-xs text-muted-foreground text-center py-4">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} class="text-sm">
              <div class="flex items-baseline gap-2">
                <span class="font-medium text-xs" style={{ color: msg.color }}>
                  {msg.userName}
                </span>
                <span class="text-[10px] text-muted-foreground">{formatTime(msg.createdAt)}</span>
              </div>
              <p class="text-foreground mt-0.5 break-words">{msg.text}</p>
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
        class="p-3 border-t border-border flex gap-2"
      >
        <form.Field name="message">
          {(field: any) => (
            <Input
              value={field.state.value}
              onInput={(e) => field.handleChange((e.target as HTMLInputElement).value)}
              onBlur={field.handleBlur}
              placeholder={connected ? 'Type a message...' : 'Connecting...'}
              disabled={!connected}
              className="flex-1 text-sm"
            />
          )}
        </form.Field>
        <form.Subscribe
          selector={(state: any) => ({
            message: state.values.message,
          })}
        >
          {({ message }: { message: string }) => (
            <Button type="submit" size="sm" disabled={!connected || !message.trim()}>
              Send
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
