import { cn } from '@/lib/utils';

export interface TextareaProps {
  className?: string;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  id?: string;
  name?: string;
  onInput?: (e: Event) => void;
  onChange?: (e: Event) => void;
  onBlur?: (e: Event) => void;
  onFocus?: (e: Event) => void;
}

export function Textarea({ className, rows = 3, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(
        'flex min-h-[60px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none transition-all',
        className
      )}
      {...props}
    />
  );
}
