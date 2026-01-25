/**
 * Global auth store - singleton pattern for auth state
 */

import type { User } from '@codesync/shared';
import { apiCall, clearToken, getToken, setToken } from '../api/client';

type Listener = () => void;

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Singleton store
class AuthStore {
  private state: AuthState = {
    user: null,
    loading: true,
    error: null,
  };
  private listeners: Set<Listener> = new Set();
  private initialized = false;

  getState() {
    return this.state;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  private setState(partial: Partial<AuthState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    const token = getToken();
    if (!token) {
      this.setState({ user: null, loading: false, error: null });
      return;
    }

    try {
      const { user } = await apiCall<{ user: User }>('GET', '/auth/me');
      this.setState({ user, loading: false, error: null });
    } catch {
      clearToken();
      this.setState({ user: null, loading: false, error: null });
    }
  }

  async login(email: string, password: string) {
    this.setState({ error: null });
    try {
      const { user, token } = await apiCall<{ user: User; token: string }>('POST', '/auth/login', {
        email,
        password,
      });
      setToken(token);
      this.setState({ user, loading: false, error: null });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      this.setState({ error: message });
      return { success: false, error: message };
    }
  }

  async register(email: string, password: string, name: string) {
    this.setState({ error: null });
    try {
      const { user, token } = await apiCall<{ user: User; token: string }>(
        'POST',
        '/auth/register',
        { email, password, name }
      );
      setToken(token);
      this.setState({ user, loading: false, error: null });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      this.setState({ error: message });
      return { success: false, error: message };
    }
  }

  async logout() {
    await apiCall('POST', '/auth/logout').catch(() => {});
    clearToken();
    this.setState({ user: null, loading: false, error: null });
  }
}

export const authStore = new AuthStore();
