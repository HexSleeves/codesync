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
  submitLabel = 'Comment',
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
        className="flex gap-2"
      >
        <Input
          type="text"
          placeholder={placeholder}
          className="flex-1 h-8 text-sm rounded-lg bg-background/50 border-border/50 placeholder:text-muted-foreground/40"
          {...form.getFieldProps('text')}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!form.values.text.trim() || form.isSubmitting}
          className="h-8 rounded-lg bg-primary hover:bg-primary/90 text-xs"
        >
          {form.isSubmitting ? '...' : submitLabel}
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
      <Textarea
        placeholder={placeholder}
        rows={3}
        className="rounded-lg bg-background/50 border-border/50 placeholder:text-muted-foreground/40 text-sm"
        {...form.getTextAreaProps('text')}
      />
      <div className="flex justify-end gap-2 mt-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-xs h-7"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={!form.values.text.trim() || form.isSubmitting}
          className="text-xs h-7 rounded-md bg-primary hover:bg-primary/90"
        >
          {form.isSubmitting ? 'Adding...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
