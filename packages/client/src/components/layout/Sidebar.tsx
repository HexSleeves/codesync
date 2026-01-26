/**
 * Reusable Sidebar component with mobile drawer support
 * Handles both desktop sidebar and mobile drawer + overlay pattern
 */

import type { Child } from 'hono/jsx';
import { CloseIcon } from '@/components/icons';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface SidebarProps {
  /** Whether the sidebar is visible */
  open: boolean;
  /** Callback when sidebar should close */
  onClose: () => void;
  /** Which side the sidebar appears on */
  side: 'left' | 'right';
  /** Width class (default: w-64) */
  width?: string;
  /** Title shown in mobile drawer header */
  title?: string;
  /** Whether to show header with close button on mobile */
  showMobileHeader?: boolean;
  /** Content to render in the sidebar */
  children: Child;
  /** Additional class names */
  className?: string;
}

export function Sidebar({
  open,
  onClose,
  side,
  width = 'w-64',
  title,
  showMobileHeader = true,
  children,
  className,
}: SidebarProps) {
  if (!open) return null;

  const sideClasses = side === 'left' 
    ? 'left-0 border-r' 
    : 'right-0 border-l';

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          width,
          'border-border flex-col bg-card hidden md:flex shrink-0',
          side === 'left' ? 'border-r' : 'border-l',
          className
        )}
      >
        {children}
      </aside>

      {/* Mobile Drawer */}
      <aside
        className={cn(
          'absolute inset-y-0 z-30',
          width,
          sideClasses,
          'border-border flex flex-col bg-card md:hidden',
          className
        )}
      >
        {showMobileHeader && (
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-sm font-medium">{title}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label={`Close ${title?.toLowerCase() || 'sidebar'}`}
            >
              <CloseIcon className="size-4" />
            </Button>
          </div>
        )}
        {children}
      </aside>

      {/* Mobile Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-20 md:hidden"
        onClick={onClose}
      />
    </>
  );
}
