/**
 * Home/Landing page - Premium dark-mode design with glass morphism
 */

import { Button } from '@/components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { Link } from '../router';

export function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary gradient orb */}
        <div
          className="absolute -top-[40%] -right-[20%] w-[80%] h-[80%] rounded-full opacity-20 blur-[120px] animate-pulse-glow"
          style={{ background: 'radial-gradient(circle, oklch(0.55 0.25 259), transparent 70%)' }}
        />
        {/* Secondary gradient orb */}
        <div
          className="absolute -bottom-[30%] -left-[20%] w-[60%] h-[60%] rounded-full opacity-15 blur-[100px] animate-pulse-glow"
          style={{
            background: 'radial-gradient(circle, oklch(0.55 0.22 300), transparent 70%)',
            animationDelay: '1.5s',
          }}
        />
        {/* Accent orb */}
        <div
          className="absolute top-[20%] left-[10%] w-[30%] h-[30%] rounded-full opacity-10 blur-[80px] animate-float"
          style={{ background: 'radial-gradient(circle, oklch(0.6 0.18 230), transparent 70%)' }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(oklch(1 0 0 / 10%) 1px, transparent 1px), linear-gradient(to right, oklch(1 0 0 / 10%) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/15 transition-colors glow-sm">
              <svg className="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-foreground tracking-tight">CodeSync</span>
          </Link>
          <nav className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" className="rounded-lg bg-primary hover:bg-primary/90 glow-sm">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground rounded-lg">
                    Sign In
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="sm" className="rounded-lg bg-primary hover:bg-primary/90 glow-sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10">
        <section className="max-w-7xl mx-auto px-6 pt-20 sm:pt-32 pb-16 sm:pb-24">
          <div className="text-center max-w-3xl mx-auto animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-8 text-sm text-muted-foreground">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              Real-time collaborative code review
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              <span className="text-foreground">Review code</span>
              <br />
              <span className="gradient-text">together, faster</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Import GitHub PRs, add inline comments, see live cursors, and ship better code
              with your team — all in one beautiful interface.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href={isAuthenticated ? '/dashboard' : '/login'}>
                <Button size="lg" className="rounded-xl bg-primary hover:bg-primary/90 text-base px-8 h-12 glow-md font-medium">
                  Start Reviewing
                  <svg className="ml-2 size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Button>
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2 transition-colors"
              >
                <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View on GitHub
              </a>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="mt-24 sm:mt-32 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            <FeatureCard
              title="Real-time Collaboration"
              description="See cursors, comments, and changes from your team as they happen. Presence indicators show who's online."
              icon={
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              }
              delay={0}
              accentColor="259"
            />
            <FeatureCard
              title="GitHub Integration"
              description="Import pull requests directly from GitHub. Sync comments back and forth seamlessly."
              icon={
                <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              }
              delay={1}
              accentColor="300"
            />
            <FeatureCard
              title="Inline Comments"
              description="Add comments on specific lines, resolve discussions, and track review progress across files."
              icon={
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              }
              delay={2}
              accentColor="230"
            />
          </div>

          {/* Stats / Social Proof */}
          <div className="mt-20 sm:mt-28 flex flex-wrap justify-center gap-x-12 gap-y-6 text-center">
            <div className="animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'backwards' }}>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">100%</div>
              <div className="text-sm text-muted-foreground mt-1">Open Source</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '1s', animationFillMode: 'backwards' }}>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">Real-time</div>
              <div className="text-sm text-muted-foreground mt-1">WebSocket Sync</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '1.2s', animationFillMode: 'backwards' }}>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">GitHub</div>
              <div className="text-sm text-muted-foreground mt-1">Native Integration</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '1.4s', animationFillMode: 'backwards' }}>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">30+</div>
              <div className="text-sm text-muted-foreground mt-1">Languages Supported</div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-border/50 py-8">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <span>Built for developers who care about code quality.</span>
            <div className="flex items-center gap-4">
              <a href="https://github.com" className="hover:text-foreground transition-colors">GitHub</a>
              <span className="text-border">|</span>
              <span>CodeSync</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
  delay,
  accentColor,
}: {
  title: string;
  description: string;
  icon: any;
  delay: number;
  accentColor: string;
}) {
  return (
    <div
      className="group relative rounded-xl glass p-6 hover:bg-accent/30 transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${0.3 + delay * 0.15}s`, animationFillMode: 'backwards' }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, oklch(0.55 0.2 ${accentColor} / 8%), transparent 70%)`,
        }}
      />
      <div className="relative">
        <div
          className="size-11 rounded-lg flex items-center justify-center mb-4"
          style={{
            background: `oklch(0.55 0.2 ${accentColor} / 10%)`,
            color: `oklch(0.7 0.18 ${accentColor})`,
          }}
        >
          {icon}
        </div>
        <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
