/**
 * TanStack Query setup for Hono JSX
 * Uses @tanstack/query-core with useSyncExternalStore
 */

import {
  MutationObserver,
  type MutationObserverOptions,
  QueryClient,
  type QueryKey,
  QueryObserver,
  type QueryObserverOptions,
} from '@tanstack/query-core';
import { useEffect, useRef, useSyncExternalStore } from 'hono/jsx';

// Singleton query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

/**
 * useQuery hook using TanStack Query Core
 */
export function useQuery<TData = unknown, TError = Error>(
  options: Omit<QueryObserverOptions<TData, TError>, 'queryClient'>
) {
  const observerRef = useRef<QueryObserver<TData, TError> | null>(null);

  if (!observerRef.current) {
    observerRef.current = new QueryObserver(queryClient, options);
  }

  // Update options when key or enabled changes
  useEffect(() => {
    observerRef.current?.setOptions(options);
  }, [JSON.stringify(options.queryKey), options.enabled]);

  const result = useSyncExternalStore(
    (callback) => {
      const unsubscribe = observerRef.current!.subscribe(callback);
      return unsubscribe;
    },
    () => observerRef.current!.getCurrentResult(),
    () => observerRef.current!.getCurrentResult()
  );

  return result;
}

/**
 * useMutation hook using TanStack Query Core
 */
export function useMutation<TData = unknown, TError = Error, TVariables = void>(
  options: Omit<MutationObserverOptions<TData, TError, TVariables>, 'mutationKey'>
) {
  const observerRef = useRef<MutationObserver<TData, TError, TVariables> | null>(null);

  if (!observerRef.current) {
    observerRef.current = new MutationObserver(queryClient, options);
  }

  // Update options when callbacks change
  useEffect(() => {
    observerRef.current?.setOptions(options);
  });

  const result = useSyncExternalStore(
    (callback) => {
      const unsubscribe = observerRef.current!.subscribe(callback);
      return unsubscribe;
    },
    () => observerRef.current!.getCurrentResult(),
    () => observerRef.current!.getCurrentResult()
  );

  const mutate = (variables: TVariables) => {
    observerRef.current!.mutate(variables);
  };

  const mutateAsync = (variables: TVariables): Promise<TData> => {
    return new Promise((resolve, reject) => {
      observerRef.current!.mutate(variables, {
        onSuccess: (data) => resolve(data),
        onError: (error) => reject(error),
      });
    });
  };

  return {
    ...result,
    mutate,
    mutateAsync,
  };
}

// Helper to invalidate queries
export function invalidateQueries(queryKey: QueryKey) {
  return queryClient.invalidateQueries({ queryKey });
}

// Helper to prefetch queries
export function prefetchQuery<TData>(options: QueryObserverOptions<TData>) {
  return queryClient.prefetchQuery(options);
}
