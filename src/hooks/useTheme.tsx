/**
 * Theme management: light-first default, persisted to both the profile (DB) and
 * localStorage, and applied by toggling the `dark` class on <html>.
 *
 * The DB is the source of truth; localStorage gives an instant value before the
 * profile query resolves (and the initial class is already set in index.html).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { Theme } from '../types';
import { setTheme as persistTheme } from '../lib/actions';
import { getUserItem, setUserItem } from '../lib/auth/userStorage';
import { useProfile } from './data';
import { useAuth } from './useAuth';

const STORAGE_KEY = 'lifequest-theme';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(userId: string | null): Theme {
  if (userId) {
    const stored = getUserItem(STORAGE_KEY, userId);
    if (stored === 'light' || stored === 'dark') return stored;
  }
  return 'light';
}

function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const profile = useProfile();
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme(user?.id ?? null));

  useEffect(() => {
    setThemeState(readStoredTheme(user?.id ?? null));
  }, [user?.id]);

  // Apply the class + persist to localStorage whenever the theme changes.
  useEffect(() => {
    applyTheme(theme);
    if (user?.id) setUserItem(STORAGE_KEY, theme, user.id);
  }, [theme, user?.id]);

  // Adopt the DB value once the profile loads (DB is authoritative, e.g. after
  // an import). Setting state to the same value is a no-op, so no loops.
  useEffect(() => {
    if (profile?.theme && profile.theme !== theme) {
      setThemeState(profile.theme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    void persistTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      void persistTheme(next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/** Access the current theme and setters. Must be used within `ThemeProvider`. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
