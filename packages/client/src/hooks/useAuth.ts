/**
 * Auth hook - manages user authentication state
 */

import { useState, useEffect } from 'hono/jsx';
import { apiCall, getToken, setToken, clearToken } from '../api/client';
import type { User } from '@codesync/shared';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Check auth on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setState({ user: null, loading: false, error: null });
      return;
    }

    apiCall<{ user: User }>('GET', '/auth/me')
      .then(({ user }) => {
        setState({ user, loading: false, error: null });
      })
      .catch(() => {
        clearToken();
        setState({ user: null, loading: false, error: null });
      });
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { user, token } = await apiCall<{ user: User; token: string }>(
        'POST',
        '/auth/login',
        { email, password }
      );
      setToken(token);
      setState({ user, loading: false, error: null });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setState(s => ({ ...s, error: message }));
      return { success: false, error: message };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const { user, token } = await apiCall<{ user: User; token: string }>(
        'POST',
        '/auth/register',
        { email, password, name }
      );
      setToken(token);
      setState({ user, loading: false, error: null });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setState(s => ({ ...s, error: message }));
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    await apiCall('POST', '/auth/logout').catch(() => {});
    clearToken();
    setState({ user: null, loading: false, error: null });
  };

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    login,
    register,
    logout,
  };
}
