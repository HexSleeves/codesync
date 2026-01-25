import type { Child } from 'hono/jsx';
import { Link } from '@/router';

interface PageHeaderProps {
  children?: Child;
  showLogo?: boolean;
}

export function PageHeader({ children, showLogo = true }: PageHeaderProps) {
  return (
    <header className="border-b border-border bg-card shrink-0">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {showLogo && (
          <Link href="/" className="text-xl font-bold text-foreground">
            CodeSync
          </Link>
        )}
        {children}
      </div>
    </header>
  );
}
