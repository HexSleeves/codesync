import type { Child } from 'hono/jsx';
import { cn } from '@/lib/utils';

export interface CardProps {
  className?: string;
  children?: Child;
  onClick?: () => void;
}

export function Card({ className, children, onClick }: CardProps) {
  return (
    <div
      className={cn('rounded-xl border bg-card text-card-foreground shadow', className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: CardProps) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)}>{children}</div>;
}

export function CardTitle({ className, children }: CardProps) {
  return (
    <div className={cn('font-semibold leading-none tracking-tight', className)}>{children}</div>
  );
}

export function CardDescription({ className, children }: CardProps) {
  return <div className={cn('text-sm text-muted-foreground', className)}>{children}</div>;
}

export function CardContent({ className, children }: CardProps) {
  return <div className={cn('p-6 pt-0', className)}>{children}</div>;
}

export function CardFooter({ className, children }: CardProps) {
  return <div className={cn('flex items-center p-6 pt-0', className)}>{children}</div>;
}
