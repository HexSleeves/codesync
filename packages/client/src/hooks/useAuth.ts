/**
 * Auth hook - subscribes to global auth store
 */

import { useState, useEffect } from 'hono/jsx';
import { authStore } from '../stores/auth';

export function useAuth() {
  const [state, setState] = useState(authStore.getState());

  useEffect(() => {
    // Subscribe to changes first
    const unsubscribe = authStore.subscribe(() => {
      setState({ ...authStore.getState() });
    });
    
    // Initialize auth (will trigger subscription when done)
    authStore.init();
    
    return unsubscribe;
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    login: (email: string, password: string) => authStore.login(email, password),
    register: (email: string, password: string, name: string) => authStore.register(email, password, name),
    logout: () => authStore.logout(),
  };
}
