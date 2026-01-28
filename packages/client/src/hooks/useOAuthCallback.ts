/**
 * OAuth callback handler hook
 * Handles GitHub OAuth callback query parameters and shows appropriate toasts
 */

import { useEffect } from 'hono/jsx';
import { toast } from '@/components/ui/sonner';

interface UseOAuthCallbackOptions {
  onSuccess?: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_params: 'OAuth callback missing parameters',
  invalid_state: 'Invalid OAuth state - please try again',
  session_expired: 'Session expired - please login and try again',
  token_error: 'Failed to get access token from GitHub',
  server_error: 'Server error during GitHub connection',
};

/**
 * Hook to handle OAuth callback query parameters
 * Checks for github_connected and github_error params and shows appropriate feedback
 */
export function useOAuthCallback({ onSuccess }: UseOAuthCallbackOptions = {}) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const githubConnectedParam = params.get('github_connected');
    const githubError = params.get('github_error');

    if (githubConnectedParam === 'true') {
      toast.success('GitHub account connected successfully!');
      onSuccess?.();
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard');
    } else if (githubError) {
      const errorMessage = ERROR_MESSAGES[githubError] || `GitHub error: ${githubError}`;
      toast.error(errorMessage);
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [onSuccess]);
}
