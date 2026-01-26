/**
 * Comment form - uses custom form hook
 */

import { Button, Input, Textarea } from '@/components/ui';
import { useForm } from '@/lib/form';

interface CommentFormValues {
  text: string;
}

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
  variant = 'block',
}: CommentFormProps) {
  const form = useForm<CommentFormValues>({
    defaultValues: {
      text: '',
    },
    onSubmit: async ({ value }) => {
      if (!value.text.trim()) return;
      await onSubmit(value.text);
      form.reset();
    },
  });

  if (variant === 'inline') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="flex gap-3"
      >
        <Input
          type="text"
          placeholder={placeholder}
          className="flex-1"
          {...form.getFieldProps('text')}
        />
        <Button type="submit" disabled={!form.values.text.trim() || form.isSubmitting}>
          {form.isSubmitting ? 'Adding...' : submitLabel}
        </Button>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <Textarea placeholder={placeholder} rows={3} {...form.getTextAreaProps('text')} />
      <div className="flex justify-end gap-2 mt-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={!form.values.text.trim() || form.isSubmitting}>
          {form.isSubmitting ? 'Adding...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
