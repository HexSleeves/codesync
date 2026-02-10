import { Button } from '@/components/ui';
import { Link } from '@/router';

interface PageErrorProps {
  title?: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

export function PageError({
  title = 'Error',
  message,
  actionLabel = 'Go to Dashboard',
  actionHref = '/dashboard',
}: PageErrorProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md animate-fade-in-up">
        <div className="size-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <svg
            className="size-8 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">{title}</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">{message}</p>
        <Link href={actionHref}>
          <Button className="rounded-lg bg-primary hover:bg-primary/90 glow-sm">
            {actionLabel}
          </Button>
        </Link>
      </div>
    </div>
  );
}
