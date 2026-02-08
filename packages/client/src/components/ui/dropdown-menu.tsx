/**
 * Dropdown Menu component for Hono JSX
 * API similar to shadcn/ui but implemented with native Hono JSX
 */
import type { Child } from 'hono/jsx';
import { createContext, useContext, useEffect, useRef, useState } from 'hono/jsx';
import { cn } from '@/lib/utils';

// Inline SVG icons (replaces lucide-react dependency)
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function CircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

// Context for dropdown state
interface DropdownContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  closeOnSelect: boolean;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdown() {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error('useDropdown must be used within DropdownMenu');
  return ctx;
}

// Root
interface DropdownMenuProps {
  children: Child;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

export function DropdownMenu({
  children,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
}: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => {
    setInternalOpen(value);
    onOpenChange?.(value);
  };

  return (
    <DropdownContext.Provider value={{ open, setOpen, closeOnSelect: true }}>
      <div className="relative inline-block">{children}</div>
    </DropdownContext.Provider>
  );
}

// Trigger
interface DropdownMenuTriggerProps {
  children: Child;
  asChild?: boolean;
  className?: string;
}

export function DropdownMenuTrigger({ children, className }: DropdownMenuTriggerProps) {
  const { open, setOpen } = useDropdown();
  return (
    <button
      type="button"
      className={className}
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      aria-haspopup="menu"
    >
      {children}
    </button>
  );
}

// Content
interface DropdownMenuContentProps {
  children: Child;
  className?: string;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
}

export function DropdownMenuContent({
  children,
  className,
  align = 'end',
  side = 'bottom',
  sideOffset = 4,
}: DropdownMenuContentProps) {
  const { open, setOpen } = useDropdown();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, setOpen]);

  if (!open) return null;

  const alignClass = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  }[align];

  const sideClass = {
    top: 'bottom-full mb-1',
    bottom: 'top-full mt-1',
    left: 'right-full mr-1',
    right: 'left-full ml-1',
  }[side];

  return (
    <div
      ref={ref}
      role="menu"
      className={cn(
        'absolute z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        'animate-in fade-in-0 zoom-in-95',
        alignClass,
        sideClass,
        className
      )}
      style={{ marginTop: side === 'bottom' ? sideOffset : undefined }}
    >
      {children}
    </div>
  );
}

// Item
interface DropdownMenuItemProps {
  children: Child;
  className?: string;
  inset?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  destructive?: boolean;
}

export function DropdownMenuItem({
  children,
  className,
  inset,
  disabled,
  onSelect,
  destructive,
}: DropdownMenuItemProps) {
  const { setOpen, closeOnSelect } = useDropdown();

  const handleClick = () => {
    if (disabled) return;
    onSelect?.();
    if (closeOnSelect) setOpen(false);
  };

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:bg-accent focus:text-accent-foreground',
        disabled && 'pointer-events-none opacity-50',
        destructive && 'text-destructive hover:text-destructive focus:text-destructive',
        inset && 'pl-8',
        className
      )}
    >
      {children}
    </button>
  );
}

// Checkbox Item
interface DropdownMenuCheckboxItemProps {
  children: Child;
  className?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export function DropdownMenuCheckboxItem({
  children,
  className,
  checked,
  onCheckedChange,
  disabled,
}: DropdownMenuCheckboxItemProps) {
  const handleClick = () => {
    if (disabled) return;
    onCheckedChange?.(!checked);
  };

  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:bg-accent focus:text-accent-foreground',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && <CheckIcon className="h-4 w-4" />}
      </span>
      {children}
    </button>
  );
}

// Radio Group Context
interface RadioGroupContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextValue>({});

interface DropdownMenuRadioGroupProps {
  children: Child;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function DropdownMenuRadioGroup({
  children,
  value,
  onValueChange,
}: DropdownMenuRadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <fieldset>{children}</fieldset>
    </RadioGroupContext.Provider>
  );
}

// Radio Item
interface DropdownMenuRadioItemProps {
  children: Child;
  className?: string;
  value: string;
  disabled?: boolean;
}

export function DropdownMenuRadioItem({
  children,
  className,
  value,
  disabled,
}: DropdownMenuRadioItemProps) {
  const { value: groupValue, onValueChange } = useContext(RadioGroupContext);
  const checked = groupValue === value;

  const handleClick = () => {
    if (disabled) return;
    onValueChange?.(value);
  };

  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:bg-accent focus:text-accent-foreground',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && <CircleIcon className="h-2 w-2 fill-current" />}
      </span>
      {children}
    </button>
  );
}

// Label
interface DropdownMenuLabelProps {
  children: Child;
  className?: string;
  inset?: boolean;
}

export function DropdownMenuLabel({ children, className, inset }: DropdownMenuLabelProps) {
  return (
    <div className={cn('px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', className)}>
      {children}
    </div>
  );
}

// Separator
interface DropdownMenuSeparatorProps {
  className?: string;
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return <div className={cn('-mx-1 my-1 h-px bg-muted', className)} />;
}

// Shortcut
interface DropdownMenuShortcutProps {
  children: Child;
  className?: string;
}

export function DropdownMenuShortcut({ children, className }: DropdownMenuShortcutProps) {
  return (
    <span className={cn('ml-auto text-xs tracking-widest opacity-60', className)}>{children}</span>
  );
}

// Group (just a wrapper)
export function DropdownMenuGroup({ children }: { children: Child }) {
  return <fieldset>{children}</fieldset>;
}

// Sub menu context
interface SubMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SubMenuContext = createContext<SubMenuContextValue | null>(null);

// Sub
interface DropdownMenuSubProps {
  children: Child;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

export function DropdownMenuSub({
  children,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
}: DropdownMenuSubProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => {
    setInternalOpen(value);
    onOpenChange?.(value);
  };

  return (
    <SubMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative">{children}</div>
    </SubMenuContext.Provider>
  );
}

// SubTrigger
interface DropdownMenuSubTriggerProps {
  children: Child;
  className?: string;
  inset?: boolean;
}

export function DropdownMenuSubTrigger({
  children,
  className,
  inset,
}: DropdownMenuSubTriggerProps) {
  const ctx = useContext(SubMenuContext);
  if (!ctx) return null;

  return (
    <button
      type="button"
      onMouseEnter={() => ctx.setOpen(true)}
      onMouseLeave={() => ctx.setOpen(false)}
      className={cn(
        'flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
        'hover:bg-accent focus:bg-accent',
        inset && 'pl-8',
        className
      )}
    >
      {children}
      <ChevronRightIcon className="ml-auto h-4 w-4" />
    </button>
  );
}

// SubContent
interface DropdownMenuSubContentProps {
  children: Child;
  className?: string;
}

export function DropdownMenuSubContent({ children, className }: DropdownMenuSubContentProps) {
  const ctx = useContext(SubMenuContext);
  if (!ctx || !ctx.open) return null;

  return (
    <div
      onMouseEnter={() => ctx.setOpen(true)}
      onMouseLeave={() => ctx.setOpen(false)}
      className={cn(
        'absolute left-full top-0 z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg',
        'animate-in fade-in-0 zoom-in-95 slide-in-from-left-2',
        className
      )}
    >
      {children}
    </div>
  );
}

// Portal (no-op for now, content renders inline)
export function DropdownMenuPortal({ children }: { children: Child }) {
  return <>{children}</>;
}
