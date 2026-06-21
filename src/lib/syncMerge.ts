/**
 * Merge two LifeQuest export bundles for cloud sync.
 * Pure logic — safe to import from client and server.
 */
import { statLevelFromXP } from './gamification';
import type {
  Completion,
  EnergyCheckin,
  ExportBundle,
  Profile,
  Quest,
  Review,
  SkillNode,
  SkillNodeStatus,
  Stat,
  StatKey,
  SyncDeletions,
} from '../types';

const STATUS_RANK: Record<SkillNodeStatus, number> = {
  locked: 0,
  unlocked: 1,
  completed: 2,
};

/** Strip removed legacy fields from older backup/sync payloads. */
function normalizeBundle(bundle: ExportBundle & { bosses?: unknown }): ExportBundle {
  const { bosses: _legacy, ...rest } = bundle;
  return rest;
}

function ts(record: { createdAt?: number; updatedAt?: number }): number {
  return record.updatedAt ?? record.createdAt ?? 0;
}

function pickNewer<T extends { createdAt?: number; updatedAt?: number }>(
  a: T,
  b: T,
): T {
  return ts(b) >= ts(a) ? b : a;
}

function mergeProfile(local: Profile, remote: Profile): Profile {
  if (remote.totalXP > local.totalXP) {
    return { ...remote, id: 1 };
  }
  if (local.totalXP > remote.totalXP) {
    return { ...local, id: 1 };
  }
  const newer = pickNewer(local, remote);
  return {
    ...newer,
    id: 1,
    totalXP: Math.max(local.totalXP, remote.totalXP),
  };
}

function mergeStats(local: Stat[], remote: Stat[]): Stat[] {
  const byKey = new Map<StatKey, Stat>();
  for (const s of local) byKey.set(s.key, s);
  for (const r of remote) {
    const existing = byKey.get(r.key);
    if (!existing) {
      byKey.set(r.key, r);
      continue;
    }
    const xp = Math.max(existing.xp, r.xp);
    byKey.set(r.key, {
      ...existing,
      xp,
      level: statLevelFromXP(xp).level,
      description: r.xp >= existing.xp ? r.description : existing.description,
    });
  }
  return [...byKey.values()];
}

function mergeQuests(local: Quest[], remote: Quest[]): Quest[] {
  const map = new Map<string, Quest>();
  for (const q of local) map.set(q.id, q);
  for (const r of remote) {
    const existing = map.get(r.id);
    map.set(r.id, existing ? pickNewer(existing, r) : r);
  }
  return [...map.values()];
}

function mergeCompletions(local: Completion[], remote: Completion[]): Completion[] {
  const key = (c: Completion) => `${c.questId}\0${c.date}`;
  const map = new Map<string, Completion>();
  for (const c of local) map.set(key(c), c);
  for (const r of remote) {
    const existing = map.get(key(r));
    map.set(key(r), existing ? pickNewer(existing, r) : r);
  }
  return [...map.values()];
}

function mergeSkillNodes(local: SkillNode[], remote: SkillNode[]): SkillNode[] {
  const map = new Map<string, SkillNode>();
  for (const n of local) map.set(n.id, n);
  for (const r of remote) {
    const existing = map.get(r.id);
    if (!existing) {
      map.set(r.id, r);
      continue;
    }
    const rankA = STATUS_RANK[existing.status];
    const rankB = STATUS_RANK[r.status];
    map.set(
      r.id,
      rankB >= rankA
        ? { ...r, title: rankB > rankA ? r.title : existing.title }
        : existing,
    );
  }
  return [...map.values()];
}

function mergeEnergyCheckins(
  local: EnergyCheckin[],
  remote: EnergyCheckin[],
): EnergyCheckin[] {
  const map = new Map<string, EnergyCheckin>();
  for (const e of local) map.set(e.date, e);
  for (const r of remote) map.set(r.date, r);
  return [...map.values()];
}

function mergeReviews(local: Review[], remote: Review[]): Review[] {
  const byWeek = new Map<string, Review>();
  for (const r of [...local, ...remote]) {
    const existing = byWeek.get(r.weekStart);
    if (!existing || ts(r) >= ts(existing)) byWeek.set(r.weekStart, r);
  }
  return [...byWeek.values()];
}

function applyDeletions(bundle: ExportBundle, deletions?: SyncDeletions): ExportBundle {
  if (!deletions) return bundle;
  const questIds = new Set(deletions.quests ?? []);
  const completionIds = new Set(deletions.completions ?? []);
  const reviewIds = new Set(deletions.reviews ?? []);
  return {
    ...bundle,
    quests: bundle.quests.filter((q) => !questIds.has(q.id)),
    completions: bundle.completions.filter((c) => !completionIds.has(c.id)),
    reviews: bundle.reviews.filter((r) => !reviewIds.has(r.id)),
  };
}

/** Merge local and remote bundles; optional deletions apply to both sides first. */
export function mergeBundles(
  local: ExportBundle,
  remote: ExportBundle,
  deletions?: SyncDeletions,
): ExportBundle {
  const a = applyDeletions(normalizeBundle(local), deletions);
  const b = applyDeletions(normalizeBundle(remote), deletions);

  const localProfile = a.profile[0];
  const remoteProfile = b.profile[0];
  const profile =
    localProfile && remoteProfile
      ? [mergeProfile(localProfile, remoteProfile)]
      : localProfile
        ? a.profile
        : b.profile;

  return {
    version: Math.max(a.version, b.version, 2),
    exportedAt: Date.now(),
    profile,
    stats: mergeStats(a.stats, b.stats),
    quests: mergeQuests(a.quests, b.quests),
    completions: mergeCompletions(a.completions, b.completions),
    skillNodes: mergeSkillNodes(a.skillNodes, b.skillNodes),
    energyCheckins: mergeEnergyCheckins(a.energyCheckins, b.energyCheckins),
    reviews: mergeReviews(a.reviews, b.reviews),
  };
}

/** True when merged bundle differs from local on any table. */
export function bundleChanged(before: ExportBundle, after: ExportBundle): boolean {
  return JSON.stringify(normalizeBundle(before)) !== JSON.stringify(normalizeBundle(after));
}
