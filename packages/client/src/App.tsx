/**
 * Main App component with routing
 */

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from './hooks/useAuth';
import { DashboardPage } from './pages/Dashboard';
import { HomePage } from './pages/Home';
import { LoginPage } from './pages/Login';
import { SessionPage } from './pages/Session';
import { Link, useRouter } from './router';

export function App() {
  const { path, params } = useRouter();
  const { loading, isAuthenticated } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Route matching
  if (path === '/') {
    return <HomePage />;
  }

  if (path === '/login') {
    if (isAuthenticated) {
      // Redirect to dashboard if already logged in
      window.history.replaceState({}, '', '/dashboard');
      return <DashboardPage />;
    }
    return <LoginPage />;
  }

  if (path === '/dashboard') {
    if (!isAuthenticated) {
      window.history.replaceState({}, '', '/login');
      return <LoginPage />;
    }
    return <DashboardPage />;
  }

  if (path.startsWith('/session/') && params.sessionId) {
    if (!isAuthenticated) {
      window.history.replaceState({}, '', '/login');
      return <LoginPage />;
    }
    return <SessionPage sessionId={params.sessionId} />;
  }

  // 404
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
