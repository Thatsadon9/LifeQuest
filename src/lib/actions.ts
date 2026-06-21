/**
 * All write operations (mutations) for LifeQuest.
 *
 * Every multi-table mutation runs inside a Dexie transaction so XP, stats,
 * and the skill tree stay consistent. Reads happen through the
 * live hooks in `src/hooks`; pages should never write to the DB directly —
 * call these functions instead.
 */
import { db, RW_STORES } from './db';
import { ensureSeeded } from './seed';
import { pauseSync, queueDeletion, resumeSync, scheduleSync } from './sync';
import { todayKey } from './date';
import {
  computeSkillStatuses,
  distributeStatXP,
  habitTargetCount,
  habitTrackMode,
  isHabitComplete,
  levelFromXP,
  questXP,
  statLevelFromXP,
} from './gamification';
import type {
  CompleteQuestResult,
  Completion,
  CompletionType,
  EnergyCheckin,
  ExportBundle,
  Quest,
  QuestSchedule,
  Review,
  Language,
  StatKey,
  Theme,
} from '../types';

/** Generate a stable unique id (UUID where available). */
function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

const now = () => Date.now();

function afterWrite<T>(promise: Promise<T>): Promise<T> {
  return promise.finally(() => scheduleSync());
}

/* ============================================================================
 * Quest completion lifecycle
 * ========================================================================= */

/**
 * Recompute every skill node's status from current completions & stat levels.
 * MUST run inside a `rw` transaction covering completions, stats, skillNodes.
 * @returns titles of nodes that newly became `completed` (for celebratory toasts)
 */
async function recomputeSkillNodesInner(): Promise<string[]> {
  const [nodes, completions, stats] = await Promise.all([
    db.skillNodes.toArray(),
    db.completions.toArray(),
    db.stats.toArray(),
  ]);

  const questCompletions: Record<string, number> = {};
  let totalCompletions = 0;
  for (const c of completions) {
    if (c.completionType === 'skip') continue;
    if (c.xpAwarded <= 0) continue;
    questCompletions[c.questId] = (questCompletions[c.questId] ?? 0) + 1;
    totalCompletions += 1;
  }
  const statLevels: Partial<Record<StatKey, number>> = {};
  for (const s of stats) statLevels[s.key] = s.level;

  const statuses = computeSkillStatuses(nodes, {
    questCompletions,
    statLevels,
    totalCompletions,
  });

  const newlyCompleted: string[] = [];
  for (const n of nodes) {
    const next = statuses[n.id] ?? n.status;
    if (next !== n.status) {
      await db.skillNodes.update(n.id, { status: next });
      if (next === 'completed' && n.status !== 'completed') {
        newlyCompleted.push(n.title);
      }
    }
  }
  return newlyCompleted;
}

/** Award XP/stats/skills for a finished habit or quest tier. */
async function awardQuestCompletion(
  quest: Quest,
  questId: string,
  type: Exclude<CompletionType, 'skip'>,
  progress?: number,
): Promise<CompleteQuestResult> {
  const today = todayKey();
  const xpAwarded = questXP(quest, type);
  const statGains = distributeStatXP(quest, xpAwarded);

  const completion: Completion = {
    id: uid(),
    questId,
    date: today,
    completionType: type,
    xpAwarded,
    statGains,
    progress,
    createdAt: Date.now(),
  };
  await db.completions.add(completion);

  const profile = await db.profile.get(1);
  const beforeLevel = profile ? levelFromXP(profile.totalXP).level : 1;
  const newTotal = (profile?.totalXP ?? 0) + xpAwarded;
  await db.profile.update(1, { totalXP: newTotal, updatedAt: now() });
  const newLevel = levelFromXP(newTotal).level;
  const leveledUp = newLevel > beforeLevel;

  const statLevelUps: StatKey[] = [];
  for (const k of Object.keys(statGains) as StatKey[]) {
    const stat = await db.stats.get(k);
    if (!stat) continue;
    const before = statLevelFromXP(stat.xp).level;
    const newXp = stat.xp + (statGains[k] ?? 0);
    const after = statLevelFromXP(newXp).level;
    await db.stats.update(k, { xp: newXp, level: after });
    if (after > before) statLevelUps.push(k);
  }

  const unlockedNodeTitles = await recomputeSkillNodesInner();

  return {
    xpAwarded,
    leveledUp,
    newLevel,
    statLevelUps,
    unlockedNodeTitles,
    heroBonus: type === 'hero',
  };
}

/**
 * Complete a quest for today at the given tier.
 *
 * Guards once-per-day (throws if already completed today; an existing *skip*
 * or partial counter progress is replaced). Awards XP, grows target stats,
 * and recomputes the skill tree — all atomically.
 */
export async function completeQuest(
  questId: string,
  type: Exclude<CompletionType, 'skip'>,
): Promise<CompleteQuestResult> {
  const today = todayKey();
  return afterWrite(db.transaction('rw', RW_STORES, async () => {
    const quest = await db.quests.get(questId);
    if (!quest) throw new Error('Quest not found.');

    const existing = await db.completions
      .where('[questId+date]')
      .equals([questId, today])
      .first();
    if (existing && isHabitComplete(quest, existing)) {
      throw new Error('This quest is already complete today.');
    }
    if (existing) await db.completions.delete(existing.id);

    const progress =
      habitTrackMode(quest) === 'counter' ? habitTargetCount(quest) : undefined;
    return awardQuestCompletion(quest, questId, type, progress);
  }));
}

/** Mark a binary habit done for today (normal tier XP). */
export async function completeHabit(questId: string): Promise<CompleteQuestResult> {
  return completeQuest(questId, 'normal');
}

export interface IncrementHabitResult {
  progress: number;
  targetCount: number;
  completed: boolean;
  reward?: CompleteQuestResult;
}

/** Add one count toward a counter habit; awards XP when the target is reached. */
export async function incrementHabit(questId: string): Promise<IncrementHabitResult> {
  const today = todayKey();
  return afterWrite(db.transaction('rw', RW_STORES, async () => {
    const quest = await db.quests.get(questId);
    if (!quest) throw new Error('Quest not found.');
    if (habitTrackMode(quest) !== 'counter') {
      throw new Error('Not a counter habit.');
    }

    const target = habitTargetCount(quest);
    const existing = await db.completions
      .where('[questId+date]')
      .equals([questId, today])
      .first();

    if (existing && isHabitComplete(quest, existing)) {
      throw new Error('This habit is already complete today.');
    }
    if (existing) await db.completions.delete(existing.id);

    const current = existing?.progress ?? 0;
    const next = current + 1;

    if (next >= target) {
      const reward = await awardQuestCompletion(quest, questId, 'normal', target);
      return { progress: target, targetCount: target, completed: true, reward };
    }

    await db.completions.add({
      id: uid(),
      questId,
      date: today,
      completionType: 'normal',
      xpAwarded: 0,
      statGains: {},
      progress: next,
      createdAt: Date.now(),
    });

    return { progress: next, targetCount: target, completed: false };
  }));
}

/** Undo one counter step (blocked after the habit is fully complete). */
export async function decrementHabit(questId: string): Promise<void> {
  const today = todayKey();
  return afterWrite(
    db.transaction('rw', [db.quests, db.completions], async () => {
      const quest = await db.quests.get(questId);
      if (!quest) throw new Error('Quest not found.');
      if (habitTrackMode(quest) !== 'counter') {
        throw new Error('Not a counter habit.');
      }

      const existing = await db.completions
        .where('[questId+date]')
        .equals([questId, today])
        .first();
      if (!existing) return;
      if (existing.xpAwarded > 0) {
        throw new Error('Cannot undo after the habit is complete.');
      }

      const current = existing.progress ?? 0;
      if (current <= 1) {
        await db.completions.delete(existing.id);
      } else {
        await db.completions.update(existing.id, { progress: current - 1 });
      }
    }),
  );
}

/**
 * Record an intentional skip for today (no XP). No-op if already skipped;
 * throws if the quest was already completed today.
 */
export async function skipQuest(questId: string): Promise<void> {
  const today = todayKey();
  return afterWrite(
    db.transaction('rw', db.quests, db.completions, async () => {
    const quest = await db.quests.get(questId);
    if (!quest) throw new Error('Quest not found.');
    const existing = await db.completions
      .where('[questId+date]')
      .equals([questId, today])
      .first();
    if (existing) {
      if (existing.completionType === 'skip') return;
      if (isHabitComplete(quest, existing)) {
        throw new Error('This quest is already complete today.');
      }
      await db.completions.delete(existing.id);
    }
    await db.completions.add({
      id: uid(),
      questId,
      date: today,
      completionType: 'skip',
      xpAwarded: 0,
      statGains: {},
      createdAt: Date.now(),
    });
    }),
  );
}

/**
 * Reverse today's completion (or skip) for a quest, refunding XP and stat XP,
 * then recomputing the skill tree. No-op if nothing today.
 */
export async function uncompleteToday(questId: string): Promise<void> {
  const today = todayKey();
  return afterWrite(
    db.transaction('rw', RW_STORES, async () => {
      const existing = await db.completions
        .where('[questId+date]')
        .equals([questId, today])
        .first();
      if (!existing) return;
      await db.completions.delete(existing.id);
      if (existing.completionType === 'skip') return;

      const profile = await db.profile.get(1);
      if (profile) {
        await db.profile.update(1, {
          totalXP: Math.max(0, profile.totalXP - existing.xpAwarded),
          updatedAt: now(),
        });
      }
      for (const k of Object.keys(existing.statGains) as StatKey[]) {
        const stat = await db.stats.get(k);
        if (!stat) continue;
        const newXp = Math.max(0, stat.xp - (existing.statGains[k] ?? 0));
        await db.stats.update(k, { xp: newXp, level: statLevelFromXP(newXp).level });
      }
      await recomputeSkillNodesInner();
    }),
  );
}

/* ============================================================================
 * Quest CRUD
 * ========================================================================= */

/** Shape accepted by {@link createQuest} (id/createdAt are generated). */
export type NewQuest = Omit<Quest, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'schedule'> & {
  isActive?: boolean;
  schedule?: QuestSchedule;
};

/** Create a new quest. Defaults `isActive` to true and `schedule` to every day. */
export async function createQuest(data: NewQuest): Promise<Quest> {
  const quest: Quest = {
    ...data,
    schedule: data.schedule ?? {},
    isActive: data.isActive ?? true,
    id: uid(),
    createdAt: now(),
    updatedAt: now(),
  };
  await db.quests.add(quest);
  scheduleSync();
  return quest;
}

/** Patch fields on an existing quest. */
export async function updateQuest(
  id: string,
  patch: Partial<Omit<Quest, 'id'>>,
): Promise<void> {
  await db.quests.update(id, { ...patch, updatedAt: now() });
  scheduleSync();
}

/** Delete a quest and all of its completion history. */
export async function deleteQuest(id: string): Promise<void> {
  await afterWrite(
    db.transaction('rw', db.quests, db.completions, async () => {
      await db.quests.delete(id);
      await db.completions.where('questId').equals(id).delete();
    }),
  );
  queueDeletion('quests', id);
}

/** Activate or deactivate a quest (deactivated quests leave the Today screen). */
export async function setQuestActive(id: string, active: boolean): Promise<void> {
  await db.quests.update(id, { isActive: active, updatedAt: now() });
  scheduleSync();
}

/* ============================================================================
 * Energy
 * ========================================================================= */

/** Set (or replace) the energy check-in (1–5) for a day. */
export async function setEnergy(date: string, value: number): Promise<EnergyCheckin> {
  const checkin: EnergyCheckin = { date, value: clamp(Math.round(value), 1, 5) };
  await db.energyCheckins.put(checkin);
  scheduleSync();
  return checkin;
}

/* ============================================================================
 * Reviews
 * ========================================================================= */

/** Shape accepted by {@link saveReview} (id/createdAt are generated). */
export type NewReview = Omit<Review, 'id' | 'createdAt'>;

/**
 * Persist a weekly review, upserting by `weekStart`: saving again for a week
 * that already has a review UPDATES the existing record (preserving its id and
 * original `createdAt`) instead of inserting a duplicate. Any stray duplicates
 * for that week (from before upsert) are cleaned up in the same transaction.
 */
export async function saveReview(review: NewReview): Promise<Review> {
  return afterWrite(
    db.transaction('rw', db.reviews, async () => {
    const forWeek = await db.reviews
      .where('weekStart')
      .equals(review.weekStart)
      .toArray();
    // Keep the oldest as the canonical record so history order stays stable.
    const canonical = forWeek.reduce<Review | null>(
      (oldest, r) => (!oldest || r.createdAt < oldest.createdAt ? r : oldest),
      null,
    );
    const full: Review = {
      ...review,
      id: canonical?.id ?? uid(),
      createdAt: canonical?.createdAt ?? Date.now(),
    };
    await db.reviews.put(full);
    // Remove any older duplicate rows for the same week.
    await Promise.all(
      forWeek
        .filter((r) => r.id !== full.id)
        .map((r) => db.reviews.delete(r.id)),
    );
    return full;
    }),
  );
}

/* ============================================================================
 * Skill tree
 * ========================================================================= */

/** Public: recompute all skill node statuses (e.g. after manual data edits). */
export async function recomputeSkillNodes(): Promise<string[]> {
  return afterWrite(
    db.transaction(
      'rw',
      db.completions,
      db.stats,
      db.skillNodes,
      async () => recomputeSkillNodesInner(),
    ),
  );
}

/* ============================================================================
 * Profile / theme
 * ========================================================================= */

/** Rename the player. */
export async function setProfileName(name: string): Promise<void> {
  await db.profile.update(1, { name: name.trim() || 'Hero', updatedAt: now() });
  scheduleSync();
}

/** Persist the colour theme on the profile (UI class is handled by ThemeProvider). */
export async function setTheme(theme: Theme): Promise<void> {
  await db.profile.update(1, { theme, updatedAt: now() });
  scheduleSync();
}

/** Persist the UI language on the profile (applied by LanguageProvider). */
export async function setLanguage(language: Language): Promise<void> {
  await db.profile.update(1, { language, updatedAt: now() });
  scheduleSync();
}

/* ============================================================================
 * Backup / restore
 * ========================================================================= */

const EXPORT_VERSION = 2;
const EXPORT_TABLES = [
  'profile',
  'stats',
  'quests',
  'completions',
  'skillNodes',
  'energyCheckins',
  'reviews',
] as const;

/** Serialise the entire database to a pretty JSON string. */
export async function exportData(): Promise<string> {
  const bundle: ExportBundle = {
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
  return JSON.stringify(bundle, null, 2);
}

/**
 * Replace ALL data with the contents of a previously exported bundle.
 * Validates shape before clearing; throws on malformed input.
 */
export async function importData(json: string): Promise<void> {
  let data: Partial<ExportBundle>;
  try {
    data = JSON.parse(json) as Partial<ExportBundle>;
  } catch {
    throw new Error('Could not parse the backup file (invalid JSON).');
  }
  if (!data || typeof data !== 'object') {
    throw new Error('That does not look like a LifeQuest backup.');
  }
  for (const t of EXPORT_TABLES) {
    const value = data[t];
    if (value !== undefined && !Array.isArray(value)) {
      throw new Error(`Backup is missing or has an invalid "${t}" table.`);
    }
  }

  pauseSync();
  try {
    await db.transaction('rw', RW_STORES, async () => {
      await Promise.all(EXPORT_TABLES.map((t) => db.table(t).clear()));
      if (data.profile?.length) {
        await db.profile.bulkPut(
          data.profile.map((p) => ({
            ...p,
            language: p.language === 'th' ? 'th' : 'en',
          })),
        );
      }
      if (data.stats?.length) await db.stats.bulkPut(data.stats);
      if (data.quests?.length) await db.quests.bulkPut(data.quests);
      if (data.completions?.length) await db.completions.bulkPut(data.completions);
      if (data.skillNodes?.length) await db.skillNodes.bulkPut(data.skillNodes);
      if (data.energyCheckins?.length) {
        await db.energyCheckins.bulkPut(data.energyCheckins);
      }
      if (data.reviews?.length) await db.reviews.bulkPut(data.reviews);
    });
  } finally {
    resumeSync();
    scheduleSync();
  }
}

/** Wipe everything and re-seed fresh starter content. */
export async function resetData(): Promise<void> {
  pauseSync();
  try {
    await db.transaction('rw', RW_STORES, async () => {
      await Promise.all(db.tables.map((t) => t.clear()));
    });
    await ensureSeeded();
  } finally {
    resumeSync();
    scheduleSync();
  }
}
