/**
 * Comment form - uses TanStack Form
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
        <form.Field name="text">
          {(field: any) => (
            <Input
              type="text"
              value={field.state.value}
              onInput={(e) => field.handleChange((e.target as HTMLInputElement).value)}
              onBlur={field.handleBlur}
              placeholder={placeholder}
              className="flex-1"
            />
          )}
        </form.Field>
        <form.Subscribe
          selector={(state: any) => ({
            isSubmitting: state.isSubmitting,
            text: state.values.text,
          })}
        >
          {({ isSubmitting, text }: { isSubmitting: boolean; text: string }) => (
            <Button type="submit" disabled={!text.trim() || isSubmitting}>
              {isSubmitting ? 'Adding...' : submitLabel}
            </Button>
          )}
        </form.Subscribe>
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
      <form.Field name="text">
        {(field: any) => (
          <Textarea
            value={field.state.value}
            onInput={(e) => field.handleChange((e.target as HTMLTextAreaElement).value)}
            onBlur={field.handleBlur}
            placeholder={placeholder}
            rows={3}
          />
        )}
      </form.Field>
      <form.Subscribe
        selector={(state: any) => ({
          isSubmitting: state.isSubmitting,
          text: state.values.text,
        })}
      >
        {({ isSubmitting, text }: { isSubmitting: boolean; text: string }) => (
          <div className="flex justify-end gap-2 mt-2">
            {onCancel && (
              <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" size="sm" disabled={!text.trim() || isSubmitting}>
              {isSubmitting ? 'Adding...' : submitLabel}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
