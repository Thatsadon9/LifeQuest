/**
 * Cloud sync — bidirectional merge with Neon Postgres via the sync API.
 */
import { db, RW_STORES } from './db';
import { bundleChanged } from './syncMerge';
import { apiHeaders } from './api';
import type { ExportBundle, SyncDeletions, SyncResponse } from '../types';

const EXPORT_VERSION = 2;
const LAST_SYNC_KEY = 'lifequest-last-synced-at';
const DELETIONS_KEY = 'lifequest-pending-deletions';
const SYNC_API = import.meta.env.VITE_SYNC_API_URL ?? '/api';
const HEALTH_TIMEOUT_MS = 2500;

export type SyncStatus = 'idle' | 'syncing' | 'ok' | 'offline' | 'error';

let status: SyncStatus = 'idle';
let lastError: string | null = null;
let syncPaused = false;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let syncPromise: Promise<SyncStatus> | null = null;

const listeners = new Set<(status: SyncStatus) => void>();

function setStatus(next: SyncStatus) {
  status = next;
  for (const fn of listeners) fn(next);
}

export function getSyncStatus(): SyncStatus {
  return status;
}

export function getSyncError(): string | null {
  return lastError;
}

export function getLastSyncedAt(): number | null {
  const raw = localStorage.getItem(LAST_SYNC_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function subscribeSyncStatus(fn: (status: SyncStatus) => void): () => void {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

export function pauseSync(): void {
  syncPaused = true;
}

export function resumeSync(): void {
  syncPaused = false;
}

function loadDeletions(): SyncDeletions {
  try {
    const raw = localStorage.getItem(DELETIONS_KEY);
    return raw ? (JSON.parse(raw) as SyncDeletions) : {};
  } catch {
    return {};
  }
}

function saveDeletions(deletions: SyncDeletions): void {
  const hasAny =
    (deletions.quests?.length ?? 0) > 0 ||
    (deletions.completions?.length ?? 0) > 0 ||
    (deletions.reviews?.length ?? 0) > 0;
  if (!hasAny) {
    localStorage.removeItem(DELETIONS_KEY);
    return;
  }
  localStorage.setItem(DELETIONS_KEY, JSON.stringify(deletions));
}

export function queueDeletion(table: keyof SyncDeletions, id: string): void {
  const current = loadDeletions();
  const list = new Set(current[table] ?? []);
  list.add(id);
  saveDeletions({ ...current, [table]: [...list] });
  scheduleSync();
}

function clearDeletions(): void {
  localStorage.removeItem(DELETIONS_KEY);
}

/** Build an in-memory export bundle (same shape as backup JSON). */
export async function exportBundleObject(): Promise<ExportBundle> {
  return {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    profile: await db.profile.toArray(),
    stats: await db.stats.toArray(),
    quests: await db.quests.toArray(),
    completions: await db.completions.toArray(),
    skillNodes: await db.skillNodes.toArray(),
    energyCheckins: await db.energyCheckins.toArray(),
    reviews: await db.reviews.toArray(),
  };
}

/** Upsert merged data locally without clearing unrelated rows. */
export async function applyMergedBundle(bundle: ExportBundle): Promise<void> {
  pauseSync();
  try {
    await db.transaction('rw', RW_STORES, async () => {
      if (bundle.profile.length) {
        await db.profile.bulkPut(
          bundle.profile.map((p) => ({
            ...p,
            language: p.language === 'th' ? 'th' : 'en',
          })),
        );
      }
      if (bundle.stats.length) await db.stats.bulkPut(bundle.stats);
      if (bundle.quests.length) await db.quests.bulkPut(bundle.quests);
      if (bundle.completions.length) await db.completions.bulkPut(bundle.completions);
      if (bundle.skillNodes.length) await db.skillNodes.bulkPut(bundle.skillNodes);
      if (bundle.energyCheckins.length) {
        await db.energyCheckins.bulkPut(bundle.energyCheckins);
      }
      if (bundle.reviews.length) await db.reviews.bulkPut(bundle.reviews);
    });
  } finally {
    resumeSync();
  }
}

async function isSyncApiAvailable(): Promise<boolean> {
  if (!navigator.onLine) return false;
  try {
    const res = await fetch(`${SYNC_API}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Debounced background sync after local writes. */
export function scheduleSync(delayMs = 1500): void {
  if (syncPaused) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void syncNow();
  }, delayMs);
}

/** Push local state, merge on server, apply merged result locally. */
export async function syncNow(): Promise<SyncStatus> {
  if (syncPromise) return syncPromise;
  if (!navigator.onLine) {
    setStatus('offline');
    return 'offline';
  }

  syncPromise = (async () => {
    if (!(await isSyncApiAvailable())) {
      setStatus('offline');
      return 'offline';
    }

    setStatus('syncing');
    lastError = null;
    try {
      const local = await exportBundleObject();
      const deletions = loadDeletions();
      const res = await fetch(`${SYNC_API}/sync`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ bundle: local, deletions }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        let message = text;
        try {
          const parsed = JSON.parse(text) as { detail?: string; error?: string };
          message = parsed.detail ?? parsed.error ?? text;
        } catch {
          /* plain-text error body */
        }
        throw new Error(message);
      }
      const data = (await res.json()) as SyncResponse;
      if (bundleChanged(local, data.bundle)) {
        await applyMergedBundle(data.bundle);
      }
      localStorage.setItem(LAST_SYNC_KEY, String(data.exportedAt));
      clearDeletions();
      setStatus('ok');
      return 'ok';
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      setStatus(navigator.onLine ? 'error' : 'offline');
      return navigator.onLine ? 'error' : 'offline';
    } finally {
      syncPromise = null;
    }
  })();

  return syncPromise;
}

/** Initial sync on app boot (after local seed). */
export async function syncOnBoot(): Promise<void> {
  if (!navigator.onLine) {
    setStatus('offline');
    return;
  }
  await syncNow();
}

window.addEventListener('online', () => scheduleSync(500));
