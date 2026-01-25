import { useState } from 'hono/jsx';
import { Button, Input, Textarea } from '@/components/ui';

interface CommentFormProps {
  onSubmit: (text: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  variant?: 'inline' | 'block';
}

export function CommentForm({ 
  onSubmit, 
  onCancel, 
  placeholder = 'Add a comment...',
  submitLabel = 'Add Comment',
  variant = 'block'
}: CommentFormProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(text);
      setText('');
    } finally {
      setSubmitting(false);
    }
  };

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Input
          type="text"
          value={text}
          onInput={(e) => setText((e.target as HTMLInputElement).value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="submit" disabled={!text.trim() || submitting}>
          {submitting ? 'Adding...' : submitLabel}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Textarea
        value={text}
        onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
        placeholder={placeholder}
        rows={3}
      />
      <div className="flex justify-end gap-2 mt-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={!text.trim() || submitting}>
          {submitting ? 'Adding...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
