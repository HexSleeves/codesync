import { cva, type VariantProps } from 'class-variance-authority';
import type { Child } from 'hono/jsx';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
        success: 'border-green-500/50 text-green-500 [&>svg]:text-green-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface AlertProps extends VariantProps<typeof alertVariants> {
  className?: string;
  children?: Child;
}

export function Alert({ className, variant, children }: AlertProps) {
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)}>
      {children}
    </div>
  );
}

export interface AlertTitleProps {
  className?: string;
  children?: Child;
}

export function AlertTitle({ className, children }: AlertTitleProps) {
  return <h5 className={cn('mb-1 font-medium leading-none tracking-tight', className)}>{children}</h5>;
}

export interface AlertDescriptionProps {
  className?: string;
  children?: Child;
}

export function AlertDescription({ className, children }: AlertDescriptionProps) {
  return <div className={cn('text-sm [&_p]:leading-relaxed', className)}>{children}</div>;
}
