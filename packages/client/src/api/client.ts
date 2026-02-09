/**
 * API client - cookie-based auth
 */

// Fetch wrapper with cookie auth
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, { ...options, headers, credentials: 'include' });
}

// API client for raw fetch calls (useful for endpoints not using apiCall)
export const apiClient = fetchWithAuth;

// Generic API call helper
export async function apiCall<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  const response = await fetchWithAuth(`/api${path}`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Request failed' }));
    // Handle different error formats
    let message = 'Request failed';
    if (typeof data.error === 'string') {
      message = data.error;
    } else if (data.error?.message) {
      // Zod validation errors
      try {
        const errors = JSON.parse(data.error.message);
        message = errors.map((e: { message: string }) => e.message).join(', ');
      } catch {
        message = data.error.message;
      }
    }
    throw new Error(message);
  }

  return response.json();
}
