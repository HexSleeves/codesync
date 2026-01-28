/**
 * PR URL input form component
 */

import { useCallback, useEffect } from 'hono/jsx';
import { Button, DialogFooter, Input, Label, Spinner } from '@/components/ui';
import { useForm } from '@/lib/form';
import { PRValidationResult } from './PRValidation';
import type { PRValidation } from './types';

interface PRUrlFormProps {
  initialUrl?: string;
  onImport: (prUrl: string) => Promise<void>;
  onValidate: (url: string) => Promise<void>;
  validation: PRValidation | null;
  validating: boolean;
  githubConnected: boolean;
  onConnectGitHub: () => void;
  onCancel: () => void;
}

interface PRUrlFormValues {
  prUrl: string;
}

export function PRUrlForm({
  initialUrl = '',
  onImport,
  onValidate,
  validation,
  validating,
  githubConnected,
  onConnectGitHub,
  onCancel,
}: PRUrlFormProps) {
  const form = useForm<PRUrlFormValues>({
    defaultValues: {
      prUrl: initialUrl,
    },
    onSubmit: async ({ value }) => {
      if (!value.prUrl.trim()) return;
      await onImport(value.prUrl);
      form.reset();
    },
  });

  const handleInputChange = useCallback(
    (e: Event) => {
      const value = (e.target as HTMLInputElement).value;
      form.setFieldValue('prUrl', value);
    },
    [form]
  );

  const handleValidate = useCallback(() => {
    if (form.values.prUrl.trim()) {
      onValidate(form.values.prUrl);
    }
  }, [form.values.prUrl, onValidate]);

  // Update form when initialUrl changes (e.g., when selecting PR from browse mode)
  useEffect(() => {
    if (initialUrl && initialUrl !== form.values.prUrl) {
      form.setFieldValue('prUrl', initialUrl);
    }
  }, [initialUrl]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4 flex-1"
    >
      <div className="space-y-2">
        <Label htmlFor="prUrl">Pull Request URL</Label>
        <div className="flex gap-2">
          <Input
            id="prUrl"
            type="url"
            placeholder="https://github.com/owner/repo/pull/123"
            required
            className="flex-1"
            value={form.values.prUrl}
            onInput={handleInputChange}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleValidate}
            disabled={!form.values.prUrl.trim() || validating}
          >
            {validating ? 'Checking...' : 'Validate'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Supports formats: https://github.com/owner/repo/pull/123 or owner/repo#123
        </p>
      </div>

      {validation && (
        <PRValidationResult
          validation={validation}
          githubConnected={githubConnected}
          onConnectGitHub={onConnectGitHub}
        />
      )}

      <DialogFooter className="gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            form.isSubmitting || !form.values.prUrl.trim() || (validation?.needsAuth ?? false)
          }
        >
          {form.isSubmitting ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Importing...
            </>
          ) : (
            'Import PR'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
