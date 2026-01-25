import type { Child } from 'hono/jsx';
import { cn } from '@/lib/utils';

export interface SelectProps {
  className?: string;
  value?: string;
  disabled?: boolean;
  onChange?: (e: Event) => void;
  children?: Child;
}

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export interface SelectOptionProps {
  value: string;
  children?: Child;
  disabled?: boolean;
}

export function SelectOption({ value, children, disabled }: SelectOptionProps) {
  return (
    <option value={value} disabled={disabled}>
      {children}
    </option>
  );
}
