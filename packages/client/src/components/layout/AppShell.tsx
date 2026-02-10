/**
 * AppShell - Unified layout wrapper for all authenticated pages
 * Premium dark UI with glass morphism header
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
      <header className="border-b border-border/50 bg-card shrink-0 sticky top-0 z-50">
        <div className="h-14 px-4 flex items-center justify-between gap-4">
          {/* Left: Logo + Breadcrumbs */}
          <div className="flex items-center gap-1 min-w-0">
            <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
              <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <svg
                  className="size-4 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                  />
                </svg>
              </div>
              <span className="font-semibold text-foreground hidden sm:block tracking-tight">
                CodeSync
              </span>
            </Link>

            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex items-center gap-1 ml-2 min-w-0">
                {breadcrumbs.map((crumb) => (
                  <div key={crumb.label} className="flex items-center gap-1 min-w-0">
                    <ChevronRightIcon className="size-3.5 text-muted-foreground/50 shrink-0" />
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="text-sm text-muted-foreground hover:text-foreground truncate transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-sm text-foreground/80 font-medium truncate">
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
