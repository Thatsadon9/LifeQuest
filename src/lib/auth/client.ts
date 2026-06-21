/**
 * Auth API client — register, login, logout, session check.
 */
import { apiHeaders, apiInit, apiUrl } from '../api';
import type { AuthUser } from '../../types';

export async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch(apiUrl('/auth/me'), apiInit());
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || 'Could not verify session');
  }
  const data = (await res.json()) as { user: AuthUser | null };
  return data.user ?? null;
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<AuthUser> {
  const res = await fetch(
    apiUrl('/auth/login'),
    apiInit({
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ email, password }),
    }),
  );
  const data = (await res.json().catch(() => ({}))) as {
    user?: AuthUser;
    error?: string;
  };
  if (!res.ok) throw new Error(data.error ?? 'Login failed');
  if (!data.user) throw new Error('Login failed');
  return data.user;
}

export async function registerRequest(
  email: string,
  password: string,
  displayName?: string,
): Promise<AuthUser> {
  const res = await fetch(
    apiUrl('/auth/register'),
    apiInit({
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ email, password, displayName }),
    }),
  );
  const data = (await res.json().catch(() => ({}))) as {
    user?: AuthUser;
    error?: string;
  };
  if (!res.ok) throw new Error(data.error ?? 'Registration failed');
  if (!data.user) throw new Error('Registration failed');
  return data.user;
}

export async function logoutRequest(): Promise<void> {
  await fetch(
    apiUrl('/auth/logout'),
    apiInit({ method: 'POST', headers: apiHeaders() }),
  );
}
