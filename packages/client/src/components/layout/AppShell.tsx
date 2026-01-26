/**
 * AppShell - Unified layout wrapper for all authenticated pages
 * Provides consistent header with navigation and user menu
 */

import type { Child } from 'hono/jsx';
import { ChevronRightIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Link } from '@/router';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface AppShellProps {
  children: Child;
  breadcrumbs?: Breadcrumb[];
  /** Right side of header - typically user menu */
  headerRight?: Child;
  /** Additional content in header center - for session-specific controls */
  headerCenter?: Child;
  /** Full height layout (for session view) vs scrollable (for dashboard) */
  fullHeight?: boolean;
  className?: string;
}

export function AppShell({
  children,
  breadcrumbs,
  headerRight,
  headerCenter,
  fullHeight = false,
  className,
}: AppShellProps) {
  return (
    <div className={cn('min-h-dvh bg-background flex flex-col', fullHeight && 'h-dvh', className)}>
      <header className="border-b border-border bg-card shrink-0">
        <div className="h-14 px-4 flex items-center justify-between gap-4">
          {/* Left: Logo + Breadcrumbs */}
          <div className="flex items-center gap-1 min-w-0">
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              <div className="size-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CS</span>
              </div>
              <span className="font-semibold text-foreground hidden sm:block">CodeSync</span>
            </Link>

            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex items-center gap-1 ml-2 min-w-0">
                {breadcrumbs.map((crumb) => (
                  <div key={crumb.label} className="flex items-center gap-1 min-w-0">
                    <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="text-sm text-muted-foreground hover:text-foreground truncate"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-sm text-foreground font-medium truncate">
                        {crumb.label}
                      </span>
                    )}
                  </div>
                ))}
              </nav>
            )}
          </div>

          {/* Center: Optional content */}
          {headerCenter && <div className="hidden md:flex items-center gap-2">{headerCenter}</div>}

          {/* Right: User menu */}
          {headerRight && <div className="flex items-center gap-2 shrink-0">{headerRight}</div>}
        </div>
      </header>

      {fullHeight ? (
        <div className="flex-1 overflow-hidden">{children}</div>
      ) : (
        <main className="flex-1">{children}</main>
      )}
    </div>
  );
}
