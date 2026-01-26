/**
 * Home/Landing page - Mobile-first design
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { Link } from '../router';

export function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-bold text-foreground">CodeSync</h1>
          <div className="flex gap-2 sm:gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" className="sm:text-base">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="sm:text-base">
                    Sign In
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="sm" className="sm:text-base">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-4 py-12 sm:py-20">
        <div className="text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-foreground mb-4 sm:mb-6">
            Collaborative Code Review
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
            Review code together in real-time. Import GitHub PRs, add comments, track changes, and
            collaborate with your team.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href={isAuthenticated ? '/dashboard' : '/login'}>
              <Button size="lg" className="text-sm sm:text-base">
                Start Reviewing
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 sm:mt-24 grid gap-4 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="Real-time Collaboration"
            description="See cursors, comments, and changes from your team as they happen."
            icon="👥"
          />
          <FeatureCard
            title="GitHub Integration"
            description="Import pull requests directly from GitHub with a single click."
            icon="🔗"
          />
          <FeatureCard
            title="Inline Comments"
            description="Add comments on specific lines and resolve discussions as you review."
            icon="💬"
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-4">
        <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">{icon}</div>
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
