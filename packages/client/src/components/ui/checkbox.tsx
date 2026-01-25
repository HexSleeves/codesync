import { cn } from '@/lib/utils';

export interface CheckboxProps {
  id?: string;
  className?: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (e: Event) => void;
}

export function Checkbox({ className, checked, onChange, ...props }: CheckboxProps) {
  return (
    <div className="relative flex items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className={cn(
          'peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 accent-primary',
          className
        )}
        {...props}
      />
    </div>
  );
}
