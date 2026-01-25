import type { Child } from 'hono/jsx';
import { cn } from '@/lib/utils';

export interface AvatarProps {
  className?: string;
  children?: Child;
}

export function Avatar({ className, children }: AvatarProps) {
  return (
    <div className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}>
      {children}
    </div>
  );
}

export interface AvatarImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

export function AvatarImage({ src, alt, className }: AvatarImageProps) {
  if (!src) return null;
  return <img src={src} alt={alt} className={cn('aspect-square h-full w-full', className)} />;
}

export interface AvatarFallbackProps {
  className?: string;
  children?: Child;
  style?: Record<string, string>;
}

export function AvatarFallback({ className, children, style }: AvatarFallbackProps) {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium',
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
