/**
 * Main App component with routing
 */

import { type Child, useEffect } from 'hono/jsx';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { initToaster } from './components/ui/sonner';
import { useAuth } from './hooks/useAuth';
import { DashboardPage } from './pages/Dashboard';
import { HomePage } from './pages/Home';
import { LoginPage } from './pages/Login';
import { SessionPage } from './pages/Session';
import { SharedSessionPage } from './pages/SharedSession';
import { Link, navigate, useRouter } from './router';

/**
 * Loading screen shown while checking auth state
 */
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

/**
 * 404 Not Found page
 */
function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
        <p className="text-muted-foreground mb-6">Page not found</p>
        <Link href="/">
          <Button variant="link">Go home</Button>
        </Link>
      </div>
    </div>
  );
}

/**
 * Protected route wrapper - redirects to login if not authenticated
 */
function ProtectedRoute({
  children,
  isAuthenticated,
}: {
  children: Child;
  isAuthenticated: boolean;
}) {
  if (!isAuthenticated) {
    navigate('/login');
    return <LoginPage />;
  }
  return <>{children}</>;
}

/**
 * Guest-only route wrapper - redirects to dashboard if already authenticated
 */
function GuestRoute({ children, isAuthenticated }: { children: Child; isAuthenticated: boolean }) {
  if (isAuthenticated) {
    navigate('/dashboard');
    return <DashboardPage />;
  }
  return <>{children}</>;
}

/**
 * Route matching logic - returns element and key for the current path
 */
function matchRoute(
  path: string,
  params: Record<string, string>,
  isAuthenticated: boolean
): { key: string; element: Child } {
  // Public routes
  if (path === '/') {
    return { key: 'home', element: <HomePage /> };
  }

  // Guest-only routes (redirect to dashboard if authenticated)
  if (path === '/login') {
    return {
      key: 'login',
      element: (
        <GuestRoute isAuthenticated={isAuthenticated}>
          <LoginPage />
        </GuestRoute>
      ),
    };
  }

  // Protected routes (redirect to login if not authenticated)
  if (path === '/dashboard') {
    return {
      key: 'dashboard',
      element: (
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <DashboardPage />
        </ProtectedRoute>
      ),
    };
  }

  if (path.startsWith('/session/') && params.sessionId) {
    return {
      key: `session-${params.sessionId}`,
      element: (
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <SessionPage sessionId={params.sessionId} />
        </ProtectedRoute>
      ),
    };
  }

  // Public shared session (no auth required)
  if (path.startsWith('/shared/') && params.shareToken) {
    return {
      key: `shared-${params.shareToken}`,
      element: <SharedSessionPage token={params.shareToken} />,
    };
  }

  // 404 fallback
  return { key: '404', element: <NotFoundPage /> };
}

export function App() {
  const { path, params } = useRouter();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    initToaster();
  }, []);

  // Show loading while checking auth
  if (loading) {
    return (
      <div key="loading" id="app-container">
        <LoadingScreen />
      </div>
    );
  }

  // Route matching
  const { key, element } = matchRoute(path, params, isAuthenticated);

  // Wrap in a keyed container to ensure proper DOM cleanup on route changes
  return (
    <div key={key} id="app-container">
      {element}
    </div>
  );
}
