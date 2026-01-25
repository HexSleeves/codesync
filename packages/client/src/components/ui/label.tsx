import { cva, type VariantProps } from 'class-variance-authority';
import type { Child } from 'hono/jsx';
import { cn } from '@/lib/utils';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
);

export interface LabelProps extends VariantProps<typeof labelVariants> {
  className?: string;
  children?: Child;
  htmlFor?: string;
}

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <label className={cn(labelVariants(), className)} {...props}>
      {children}
    </label>
  );
}
