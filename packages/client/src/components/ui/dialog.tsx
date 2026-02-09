import type { Child } from 'hono/jsx';
import { useEffect, useRef } from 'hono/jsx';
import { cn } from '@/lib/utils';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: Child;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === overlayRef.current) {
          onOpenChange(false);
        }
      }}
    >
      {children}
    </div>
  );
}

export interface DialogContentProps {
  className?: string;
  children?: Child;
}

export function DialogContent({ className, children }: DialogContentProps) {
  return (
    <div
      className={cn(
        'relative z-[101] w-full max-w-lg rounded-xl border border-border/50 bg-card backdrop-blur-xl p-6 shadow-2xl animate-scale-in my-auto',
        className
      )}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ className, children }: { className?: string; children?: Child }) {
  return (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}>
      {children}
    </div>
  );
}

export function DialogFooter({ className, children }: { className?: string; children?: Child }) {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}>
      {children}
    </div>
  );
}

export function DialogTitle({ className, children }: { className?: string; children?: Child }) {
  return (
    <h2 className={cn('text-lg font-semibold leading-none tracking-tight text-foreground', className)}>
      {children}
    </h2>
  );
}

export function DialogDescription({
  className,
  children,
}: {
  className?: string;
  children?: Child;
}) {
  return <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>;
}

export function DialogClose({
  className,
  children,
  onClick,
}: {
  className?: string;
  children?: Child;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'absolute right-4 top-4 rounded-md p-1 opacity-50 ring-offset-background transition-all hover:opacity-100 hover:bg-accent/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
    >
      {children || (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
    </button>
  );
}
