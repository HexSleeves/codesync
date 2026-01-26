import type { Child } from 'hono/jsx';
import { Link } from '@/router';

interface PageHeaderProps {
  children?: Child;
  showLogo?: boolean;
}

export function PageHeader({ children, showLogo = true }: PageHeaderProps) {
  return (
    <header className="border-b border-border bg-card shrink-0">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        {showLogo && (
          <Link href="/" className="text-xl font-bold text-foreground">
            CodeSync
          </Link>
        )}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 shrink">{children}</div>
      </div>
    </header>
  );
}
