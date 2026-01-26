/**
 * New session creation dialog - uses custom form hook
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
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Session title"
              required
              {...form.getFieldProps('title')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What are you reviewing?"
              rows={3}
              {...form.getTextAreaProps('description')}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="isPublic" {...form.getCheckboxProps('isPublic')} />
            <Label htmlFor="isPublic" className="text-sm font-normal">
              Make this session public
            </Label>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.isSubmitting || !form.values.title}>
              {form.isSubmitting ? 'Creating...' : 'Create Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
