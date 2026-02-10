/**
 * Shared store utilities for Zustand vanilla + Hono JSX-DOM
 * Eliminates duplicated shallowEqual and useStore boilerplate
 */

import { useRef, useSyncExternalStore } from 'hono/jsx';
import type { StoreApi } from 'zustand/vanilla';

/**
 * Shallow equality check for store selectors
 */
export function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }
  const keysA = Object.keys(a) as Array<keyof T>;
  const keysB = Object.keys(b) as Array<keyof T>;
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!keysB.includes(key) || !Object.is(a[key], b[key])) {
      return false;
    }
  }
  return true;
}

/**
 * Create a typed hook for a Zustand vanilla store.
 * Uses useSyncExternalStore with shallow equality checking.
 */
export function createStoreHook<TStore>(store: StoreApi<TStore>) {
  return function useStore<T>(selector: (state: TStore) => T): T {
    const cache = useRef<{ value: T; hasValue: boolean }>({
      value: undefined as T,
      hasValue: false,
    });

    return useSyncExternalStore(
      (onStoreChange) => {
        let currentValue = selector(store.getState());
        return store.subscribe((state) => {
          const nextValue = selector(state);
          if (!shallowEqual(currentValue, nextValue)) {
            currentValue = nextValue;
            onStoreChange();
          }
        });
      },
      () => {
        const nextValue = selector(store.getState());
        if (cache.current?.hasValue && shallowEqual(cache.current.value, nextValue)) {
          return cache.current.value;
        }
        cache.current = { value: nextValue, hasValue: true };
        return nextValue;
      },
      () => selector(store.getState())
    );
  };
}
