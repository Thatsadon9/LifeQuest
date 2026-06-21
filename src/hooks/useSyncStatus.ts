import { useEffect, useState } from 'react';
import {
  getLastSyncedAt,
  getSyncError,
  getSyncStatus,
  subscribeSyncStatus,
  syncNow,
  type SyncStatus,
} from '../lib/sync';

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus());
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(getLastSyncedAt());
  const [error, setError] = useState<string | null>(getSyncError());

  useEffect(() => {
    return subscribeSyncStatus((next) => {
      setStatus(next);
      if (next === 'ok') setLastSyncedAt(getLastSyncedAt());
      setError(getSyncError());
    });
  }, []);

  const sync = async () => {
    const next = await syncNow();
    setLastSyncedAt(getLastSyncedAt());
    setError(getSyncError());
    return next;
  };

  return { status, lastSyncedAt, error, sync };
}
