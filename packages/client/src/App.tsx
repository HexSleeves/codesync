/**
 * Main App component with routing
 */

import { useRouter } from './router';
import { useAuth } from './hooks/useAuth';
import { HomePage } from './pages/Home';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { SessionPage } from './pages/Session';

export function App() {
  const { path, params } = useRouter();
  const { loading, isAuthenticated } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div class="min-h-screen bg-gray-900 flex items-center justify-center">
        <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
    <div class="min-h-screen bg-gray-900 flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-white mb-4">404</h1>
        <p class="text-gray-400 mb-6">Page not found</p>
        <a href="/" class="text-blue-400 hover:text-blue-300">
          Go home
        </a>
      </div>
    </div>
  );
}
