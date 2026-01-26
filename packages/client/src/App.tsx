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

  // Determine which page to render
  let page: any;
  let pageKey: string;

  if (loading) {
    pageKey = 'loading';
    page = (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  } else if (path === '/') {
    pageKey = 'home';
    page = <HomePage />;
  } else if (path === '/login') {
    if (isAuthenticated) {
      window.history.replaceState({}, '', '/dashboard');
      pageKey = 'dashboard';
      page = <DashboardPage />;
    } else {
      pageKey = 'login';
      page = <LoginPage />;
    }
  } else if (path === '/dashboard') {
    if (!isAuthenticated) {
      window.history.replaceState({}, '', '/login');
      pageKey = 'login';
      page = <LoginPage />;
    } else {
      pageKey = 'dashboard';
      page = <DashboardPage />;
    }
  } else if (path.startsWith('/session/') && params.sessionId) {
    if (!isAuthenticated) {
      window.history.replaceState({}, '', '/login');
      pageKey = 'login';
      page = <LoginPage />;
    } else {
      pageKey = `session-${params.sessionId}`;
      page = <SessionPage sessionId={params.sessionId} />;
    }
  } else {
    pageKey = '404';
    page = (
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

  // Wrap in a keyed container to ensure proper DOM cleanup on route changes
  return (
    <div key={pageKey} id="app-container">
      {page}
    </div>
  );
}
