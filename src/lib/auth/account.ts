/**
 * Per-account local storage — clear Dexie when switching users.
 */
import { db, RW_STORES } from '../db';
import { ensureSeeded } from '../seed';
import { pauseSync, resumeSync } from '../sync';
import {
  clearUserScopedLocalStorage,
  migrateLegacyGlobalsForUser,
  purgeLegacyGlobalStorage,
} from './userStorage';

const USER_KEY = 'lifequest-user-id';

export function getStoredUserId(): string | null {
  return localStorage.getItem(USER_KEY);
}

export function setStoredUserId(userId: string): void {
  localStorage.setItem(USER_KEY, userId);
}

export function clearStoredUserId(): void {
  localStorage.removeItem(USER_KEY);
}

/** Wipe IndexedDB game tables (no re-seed). */
export async function clearLocalGameData(): Promise<void> {
  pauseSync();
  try {
    await db.transaction('rw', RW_STORES, async () => {
      await Promise.all(RW_STORES.map((t) => t.clear()));
    });
  } finally {
    resumeSync();
  }
}

/**
 * When the signed-in user changes, reset local Dexie and seed fresh starter data.
 * Cloud sync will merge the account's remote bundle afterward.
 */
export async function prepareLocalDataForUser(userId: string): Promise<void> {
  const prev = getStoredUserId();
  if (prev === userId) {
    migrateLegacyGlobalsForUser(userId);
    return;
  }
  if (prev) migrateLegacyGlobalsForUser(prev);
  await clearLocalGameData();
  purgeLegacyGlobalStorage();
  setStoredUserId(userId);
  await ensureSeeded();
}

/** After logout — clear local game data and user marker. */
export async function clearAccountLocalState(): Promise<void> {
  const userId = getStoredUserId();
  if (userId) clearUserScopedLocalStorage(userId);
  purgeLegacyGlobalStorage();
  clearStoredUserId();
  await clearLocalGameData();
}
