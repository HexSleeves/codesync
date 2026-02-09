import { cn } from '@/lib/utils';

export interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'size-4 border-2',
    md: 'size-6 border-2',
    lg: 'size-8 border-[3px]',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-primary/30 border-t-primary',
        sizeClasses[size],
        className
      )}
    />
  );
}
