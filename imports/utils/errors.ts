/**
 * Type guard utilities for error handling
 */

export interface ErrorWithStatus {
  status: number;
  message?: string;
}

export interface ErrorWithMessage {
  message: string;
}

/**
 * Check if an error has an HTTP status code
 */
export function isErrorWithStatus(error: unknown): error is ErrorWithStatus {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  );
}

/**
 * Check if an error has a message property
 */
export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * Extract error message from unknown error
 */
export function getErrorMessage(error: unknown, fallback = 'Unknown error'): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return fallback;
}
