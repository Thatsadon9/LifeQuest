/**
 * Per-account localStorage keys — suffix with user id so accounts stay isolated.
 */
import { getStoredUserId } from './account';

/** Base keys (without user suffix) for data that belongs to one account. */
export const USER_SCOPED_STORAGE_BASES = [
  'lifequest-mira-sessions',
  'lifequest-mira-active-session',
  'lifequest-last-synced-at',
  'lifequest-pending-deletions',
  'lifequest-today-habit-sort',
  'lifequest-guide-dismissed',
  'lifequest-language',
  'lifequest-theme',
  'lifequest-notifications',
] as const;

/** Pre-auth / migration keys that must not leak across accounts. */
export const LEGACY_GLOBAL_STORAGE_KEYS = [
  'lifequest-mira-sessions',
  'lifequest-mira-active-session',
  'lifequest-last-synced-at',
  'lifequest-pending-deletions',
  'lifequest-today-habit-sort',
  'lifequest-guide-dismissed',
  'lifequest-language',
  'lifequest-theme',
  'lifequest-notifications',
] as const;

const LEGACY_SESSION_STORAGE_KEYS = ['lifequest-mira-turns'] as const;

export function userStorageKey(base: string, userId?: string | null): string {
  const uid = userId ?? getStoredUserId();
  if (!uid) return base;
  return `${base}:${uid}`;
}

export function getUserItem(base: string, userId?: string | null): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(userStorageKey(base, userId));
}

export function setUserItem(
  base: string,
  value: string,
  userId?: string | null,
): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(userStorageKey(base, userId), value);
}

export function removeUserItem(base: string, userId?: string | null): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(userStorageKey(base, userId));
}

/** Remove unscoped keys left from before per-user storage. */
export function purgeLegacyGlobalStorage(): void {
  if (typeof localStorage === 'undefined') return;
  for (const key of LEGACY_GLOBAL_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
  if (typeof sessionStorage !== 'undefined') {
    for (const key of LEGACY_SESSION_STORAGE_KEYS) {
      sessionStorage.removeItem(key);
    }
  }
}

/** Move legacy global values into the signed-in user's namespace (one-time upgrade). */
export function migrateLegacyGlobalsForUser(userId: string): void {
  if (typeof localStorage === 'undefined') return;
  for (const base of LEGACY_GLOBAL_STORAGE_KEYS) {
    const legacy = localStorage.getItem(base);
    if (!legacy) continue;
    const scoped = userStorageKey(base, userId);
    if (!localStorage.getItem(scoped)) {
      localStorage.setItem(scoped, legacy);
    }
    localStorage.removeItem(base);
  }
  if (typeof sessionStorage !== 'undefined') {
    for (const key of LEGACY_SESSION_STORAGE_KEYS) {
      sessionStorage.removeItem(key);
    }
  }
}

export function clearUserScopedLocalStorage(userId: string): void {
  if (typeof localStorage === 'undefined') return;
  for (const base of USER_SCOPED_STORAGE_BASES) {
    localStorage.removeItem(userStorageKey(base, userId));
  }
}
