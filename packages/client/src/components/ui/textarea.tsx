import { cn } from '@/lib/utils';

export interface TextareaProps {
  className?: string;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  onInput?: (e: Event) => void;
  onChange?: (e: Event) => void;
}

export function Textarea({ className, rows = 3, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(
        'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none',
        className
      )}
      {...props}
    />
  );
}
