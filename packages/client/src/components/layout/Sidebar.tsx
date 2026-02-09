/**
 * Reusable Sidebar component with mobile drawer support
 * Glass morphism design with smooth transitions
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

  const sideClasses = side === 'left' ? 'left-0 border-r' : 'right-0 border-l';

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          width,
          'border-border/50 flex-col bg-card/60 backdrop-blur-sm hidden md:flex shrink-0',
          side === 'left' ? 'border-r' : 'border-l',
          className
        )}
      >
        {children}
      </aside>

      {/* Mobile Drawer */}
      <aside
        className={cn(
          'absolute inset-y-0 z-30 animate-slide-in-left',
          width,
          sideClasses,
          'border-border/50 flex flex-col bg-card/95 backdrop-blur-xl md:hidden',
          side === 'right' && 'animate-slide-in-right',
          className
        )}
      >
        {showMobileHeader && (
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
            <span className="text-sm font-medium text-foreground">{title}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label={`Close ${title?.toLowerCase() || 'sidebar'}`}
              className="size-7 p-0 hover:bg-accent/50"
            >
              <CloseIcon className="size-4" />
            </Button>
          </div>
        )}
        {children}
      </aside>

      {/* Mobile Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden animate-fade-in" onClick={onClose} />
    </>
  );
}
