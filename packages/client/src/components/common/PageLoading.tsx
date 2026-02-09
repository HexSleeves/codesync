import { Spinner } from '@/components/ui';

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = 'Loading...' }: PageLoadingProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="relative mx-auto mb-5">
          <Spinner size="lg" className="mx-auto" />
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
