/**
 * Settings store using Zustand vanilla (compatible with Hono JSX-DOM)
 * Persists user preferences to localStorage
 */

import { useRef, useSyncExternalStore } from 'hono/jsx';
import { createStore } from 'zustand/vanilla';

const STORAGE_KEY = 'codesync-settings';

// Types for settings values
export type Theme = 'dark' | 'light' | 'system';
export type FontSize = 'sm' | 'md' | 'lg';
export type DiffMode = 'unified' | 'split';
export type ViewMode = 'diff' | 'code';

// Settings state interface
export interface SettingsState {
  // Appearance
  theme: Theme;
  fontSize: FontSize;
  // Editor
  defaultDiffMode: DiffMode;
  defaultViewMode: ViewMode;
  showLineNumbers: boolean;
  // Notifications
  soundEnabled: boolean;
  desktopNotifications: boolean;
}

// Default settings
const defaultSettings: SettingsState = {
  theme: 'system',
  fontSize: 'md',
  defaultDiffMode: 'unified',
  defaultViewMode: 'diff',
  showLineNumbers: true,
  soundEnabled: true,
  desktopNotifications: false,
};

interface SettingsActions {
  setTheme: (theme: Theme) => void;
  setFontSize: (fontSize: FontSize) => void;
  setDefaultDiffMode: (mode: DiffMode) => void;
  setDefaultViewMode: (mode: ViewMode) => void;
  setShowLineNumbers: (show: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setDesktopNotifications: (enabled: boolean) => void;
  resetSettings: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

/**
 * Load settings from localStorage
 */
function loadSettings(): SettingsState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<SettingsState>;
      // Merge with defaults to handle missing keys from older versions
      return { ...defaultSettings, ...parsed };
    }
  } catch (err) {
    console.error('Failed to load settings from localStorage:', err);
  }
  return defaultSettings;
}

/**
 * Save settings to localStorage
 */
function saveSettings(settings: SettingsState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}

/**
 * Apply theme to document
 */
function applyTheme(theme: Theme): void {
  const root = document.documentElement;

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

/**
 * Apply font size to document
 */
function applyFontSize(fontSize: FontSize): void {
  const root = document.documentElement;
  root.classList.remove('text-sm', 'text-base', 'text-lg');

  switch (fontSize) {
    case 'sm':
      root.classList.add('text-sm');
      break;
    case 'md':
      root.classList.add('text-base');
      break;
    case 'lg':
      root.classList.add('text-lg');
      break;
  }
}

// Create the store with initial state from localStorage
const initialSettings = loadSettings();

export const settingsStore = createStore<SettingsStore>()((set, get) => ({
  // Initial state
  ...initialSettings,

  // Actions
  setTheme: (theme: Theme) => {
    set({ theme });
    applyTheme(theme);
    saveSettings(get());
  },

  setFontSize: (fontSize: FontSize) => {
    set({ fontSize });
    applyFontSize(fontSize);
    saveSettings(get());
  },

  setDefaultDiffMode: (defaultDiffMode: DiffMode) => {
    set({ defaultDiffMode });
    saveSettings(get());
  },

  setDefaultViewMode: (defaultViewMode: ViewMode) => {
    set({ defaultViewMode });
    saveSettings(get());
  },

  setShowLineNumbers: (showLineNumbers: boolean) => {
    set({ showLineNumbers });
    saveSettings(get());
  },

  setSoundEnabled: (soundEnabled: boolean) => {
    set({ soundEnabled });
    saveSettings(get());
  },

  setDesktopNotifications: (desktopNotifications: boolean) => {
    set({ desktopNotifications });
    // Request permission if enabling
    if (desktopNotifications && 'Notification' in window) {
      Notification.requestPermission();
    }
    saveSettings(get());
  },

  resetSettings: () => {
    set(defaultSettings);
    applyTheme(defaultSettings.theme);
    applyFontSize(defaultSettings.fontSize);
    saveSettings(defaultSettings);
  },
}));

/**
 * Shallow equality check for store selectors
 */
function shallowEqual<T>(a: T, b: T): boolean {
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
 * Hook to use settings store with Hono JSX-DOM
 * Uses useSyncExternalStore for compatibility with shallow equality checking
 */
export function useSettingsStore<T>(selector: (state: SettingsStore) => T): T {
  const cache = useRef<{ value: T; hasValue: boolean }>({ value: undefined as T, hasValue: false });

  return useSyncExternalStore(
    (onStoreChange) => {
      // Create a custom subscribe that only notifies when selected value changes
      let currentValue = selector(settingsStore.getState());
      return settingsStore.subscribe((state) => {
        const nextValue = selector(state);
        if (!shallowEqual(currentValue, nextValue)) {
          currentValue = nextValue;
          onStoreChange();
        }
      });
    },
    () => {
      const nextValue = selector(settingsStore.getState());
      if (cache.current?.hasValue && shallowEqual(cache.current.value, nextValue)) {
        return cache.current.value;
      }
      cache.current = { value: nextValue, hasValue: true };
      return nextValue;
    },
    () => selector(settingsStore.getState())
  );
}

// Convenience selector hooks
export const useTheme = () => useSettingsStore((s) => s.theme);
export const useFontSize = () => useSettingsStore((s) => s.fontSize);
export const useDefaultDiffMode = () => useSettingsStore((s) => s.defaultDiffMode);
export const useDefaultViewMode = () => useSettingsStore((s) => s.defaultViewMode);
export const useShowLineNumbers = () => useSettingsStore((s) => s.showLineNumbers);
export const useSoundEnabled = () => useSettingsStore((s) => s.soundEnabled);
export const useDesktopNotifications = () => useSettingsStore((s) => s.desktopNotifications);

/**
 * Initialize settings (apply theme and font size on app load)
 */
export function initSettings(): void {
  const state = settingsStore.getState();
  applyTheme(state.theme);
  applyFontSize(state.fontSize);

  // Listen for system theme changes
  if (state.theme === 'system') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (settingsStore.getState().theme === 'system') {
        applyTheme('system');
      }
    });
  }
}
