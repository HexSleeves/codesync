/**
 * TanStack Form wrapper for Hono JSX compatibility
 *
 * This module re-exports TanStack Form with relaxed types to work with
 * Hono's JSX implementation. At runtime, Hono JSX is compatible with React.
 */

import { useForm as useTanStackForm } from '@tanstack/react-form';

// Re-export useForm - the `any` typing is intentional for Hono JSX compatibility
// The form works correctly at runtime; this just bypasses React type checking
export function useForm<TFormData>(opts: {
  defaultValues: TFormData;
  onSubmit: (props: { value: TFormData }) => void | Promise<void>;
}) {
  return useTanStackForm(opts);
}
