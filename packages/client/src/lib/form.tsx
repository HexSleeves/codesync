/**
 * TanStack Form wrapper for Hono JSX compatibility
 *
 * This module re-exports TanStack Form with type casting to work with
 * Hono's JSX implementation. At runtime, Hono JSX is compatible with React.
 */

import { useForm as useTanStackForm } from '@tanstack/react-form';

// Re-export useForm with any typing to bypass React/Hono JSX incompatibility
// The form works correctly at runtime; this just bypasses type checking
export function useForm<TFormData>(opts: {
  defaultValues: TFormData;
  onSubmit: (props: { value: TFormData }) => void | Promise<void>;
}): any {
  return useTanStackForm(opts as any);
}
