/**
 * Auth hook - uses Zustand vanilla store with Hono's useSyncExternalStore
 */

import { useEffect } from 'hono/jsx';
import { authStore, useAuthStore } from '../stores/auth';

export function useAuth() {
  // Use single combined selector to avoid multiple subscriptions
  const { user, loading, error } = useAuthStore((s) => ({
    user: s.user,
    loading: s.loading,
    error: s.error,
  }));

  useEffect(() => {
    authStore.getState().init();
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login: authStore.getState().login,
    register: authStore.getState().register,
    logout: authStore.getState().logout,
  };
}
