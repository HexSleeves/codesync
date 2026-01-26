/**
 * New session creation dialog - uses TanStack Form
 */

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  toast,
} from '@/components/ui';
import { useForm } from '@/lib/form';

interface NewSessionFormValues {
  title: string;
  description: string;
  isPublic: boolean;
}

interface NewSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { title: string; description?: string; isPublic?: boolean }) => Promise<void>;
}

export function NewSessionDialog({ open, onOpenChange, onCreate }: NewSessionDialogProps) {
  const form = useForm<NewSessionFormValues>({
    defaultValues: {
      title: '',
      description: '',
      isPublic: false,
    },
    onSubmit: async ({ value }) => {
      try {
        await onCreate({
          title: value.title,
          description: value.description || undefined,
          isPublic: value.isPublic,
        });
        form.reset();
      } catch (err) {
        console.error(err);
        toast.error('Failed to create session');
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Session</DialogTitle>
          <DialogDescription>Create a new code review session</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="title">
            {(field: any) => (
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={field.state.value}
                  onInput={(e) => field.handleChange((e.target as HTMLInputElement).value)}
                  onBlur={field.handleBlur}
                  placeholder="Session title"
                  required
                />
              </div>
            )}
          </form.Field>

          <form.Field name="description">
            {(field: any) => (
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={field.state.value}
                  onInput={(e) => field.handleChange((e.target as HTMLTextAreaElement).value)}
                  onBlur={field.handleBlur}
                  placeholder="What are you reviewing?"
                  rows={3}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="isPublic">
            {(field: any) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isPublic"
                  checked={field.state.value}
                  onChange={(e) => field.handleChange((e.target as HTMLInputElement).checked)}
                />
                <Label htmlFor="isPublic" className="text-sm font-normal">
                  Make this session public
                </Label>
              </div>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state: any) => ({ isSubmitting: state.isSubmitting, values: state.values })}
          >
            {({
              isSubmitting,
              values,
            }: {
              isSubmitting: boolean;
              values: NewSessionFormValues;
            }) => (
              <DialogFooter className="gap-2">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !values.title}>
                  {isSubmitting ? 'Creating...' : 'Create Session'}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
