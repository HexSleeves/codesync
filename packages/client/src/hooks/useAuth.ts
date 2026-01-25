/**
 * Auth hook - uses Zustand vanilla store with Hono's useSyncExternalStore
 */

import { useEffect } from 'hono/jsx';
import { authStore, useAuthStore } from '../stores/auth';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);

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
