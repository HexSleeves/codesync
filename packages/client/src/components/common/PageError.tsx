import { Button, Card, CardContent } from '@/components/ui';
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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="pt-6 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">{title}</h1>
          <p className="text-muted-foreground mb-6">{message}</p>
          <Link href={actionHref}>
            <Button>{actionLabel}</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
