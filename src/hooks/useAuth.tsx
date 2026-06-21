/**
 * Auth state — session cookie + per-account local data bootstrap.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthUser } from '../types';
import {
  fetchMe,
  loginRequest,
  logoutRequest,
  registerRequest,
} from '../lib/auth/client';
import {
  clearAccountLocalState,
  prepareLocalDataForUser,
} from '../lib/auth/account';
import { ensureSeeded } from '../lib/seed';
import { syncOnBoot } from '../lib/sync';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  bootstrapping: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bootstrapUserData = useCallback(async (nextUser: AuthUser) => {
    setBootstrapping(true);
    try {
      await prepareLocalDataForUser(nextUser.id);
      await ensureSeeded();
      await syncOnBoot();
    } finally {
      setBootstrapping(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await fetchMe();
      setUser(me);
      if (me) await bootstrapUserData(me);
    } catch (err) {
      setUser(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [bootstrapUserData]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      const next = await loginRequest(email, password);
      setUser(next);
      await bootstrapUserData(next);
    },
    [bootstrapUserData],
  );

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      setError(null);
      const next = await registerRequest(email, password, displayName);
      setUser(next);
      await bootstrapUserData(next);
    },
    [bootstrapUserData],
  );

  const logout = useCallback(async () => {
    setError(null);
    try {
      await logoutRequest();
    } finally {
      try {
        await clearAccountLocalState();
      } catch (err) {
        console.warn('Failed to clear local data on logout', err);
      }
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      bootstrapping,
      error,
      login,
      register,
      logout,
      refresh,
    }),
    [user, loading, bootstrapping, error, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
