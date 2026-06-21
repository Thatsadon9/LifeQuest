/**
 * Reactive read hooks built on `dexie-react-hooks` `useLiveQuery`.
 *
 * Every hook re-renders automatically when the underlying tables change (after
 * any mutation in `actions.ts`). Hooks return `undefined` while the first query
 * is loading — components should treat `undefined` as a loading state.
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { todayKey, addDays } from '../lib/date';
import {
  computeMomentum,
  habitProgressFromCompletion,
  habitTargetCount,
  habitTrackMode,
  isHabitComplete,
  levelFromXP,
  rankTitle,
  MOMENTUM_WINDOW_DAYS,
} from '../lib/gamification';
import { STAT_KEYS } from '../data/stats';
import { SKILL_PATHS } from '../data/skillPaths';
import type {
  Completion,
  EnergyCheckin,
  LevelInfo,
  MomentumInfo,
  Profile,
  Quest,
  QuestCategory,
  QuestType,
  Review,
  SkillPathWithNodes,
  Stat,
  StatKey,
  TodayQuest,
  TodayQuestGroups,
} from '../types';

/** Inclusive date range, `YYYY-MM-DD`. */
export interface DateRange {
  start: string;
  end: string;
}

/** Filter options for {@link useQuests}. */
export interface QuestFilter {
  type?: QuestType;
  stat?: StatKey;
  category?: QuestCategory;
  /** When true, only active quests are returned. */
  activeOnly?: boolean;
  /** Case-insensitive title/description search. */
  search?: string;
}

/** True if a quest is scheduled on the given weekday (0=Sun..6=Sat). */
function scheduledOn(quest: Quest, weekday: number): boolean {
  const days = quest.schedule?.days;
  return !days || days.length === 0 || days.includes(weekday);
}

/** The singleton player profile (or `undefined` while loading). */
export function useProfile(): Profile | undefined {
  return useLiveQuery(() => db.profile.get(1));
}

/** All seven stats in canonical order. */
export function useStats(): Stat[] | undefined {
  return useLiveQuery(async () => {
    const stats = await db.stats.toArray();
    const byKey = new Map(stats.map((s) => [s.key, s]));
    return STAT_KEYS.map((k) => byKey.get(k)).filter(
      (s): s is Stat => Boolean(s),
    );
  });
}

/** A single stat by key. */
export function useStat(key: StatKey): Stat | undefined {
  return useLiveQuery(() => db.stats.get(key), [key]);
}

/** Quests, optionally filtered; sorted by creation time. */
export function useQuests(filter?: QuestFilter): Quest[] | undefined {
  return useLiveQuery(
    async () => {
      let quests = await db.quests.orderBy('createdAt').toArray();
      if (filter?.activeOnly) quests = quests.filter((q) => q.isActive);
      if (filter?.type) quests = quests.filter((q) => q.type === filter.type);
      if (filter?.category) {
        quests = quests.filter((q) => q.category === filter.category);
      }
      if (filter?.stat) {
        quests = quests.filter((q) =>
          q.statTargets.some((t) => t.stat === filter.stat),
        );
      }
      if (filter?.search) {
        const needle = filter.search.toLowerCase();
        quests = quests.filter(
          (q) =>
            q.title.toLowerCase().includes(needle) ||
            q.description.toLowerCase().includes(needle),
        );
      }
      return quests;
    },
    [
      filter?.activeOnly,
      filter?.type,
      filter?.category,
      filter?.stat,
      filter?.search,
    ],
  );
}

/** All active quests, sorted by creation time. */
export function useActiveQuests(): Quest[] | undefined {
  return useLiveQuery(() =>
    db.quests
      .orderBy('createdAt')
      .filter((q) => q.isActive)
      .toArray(),
  );
}

/**
 * Active daily & recovery quests scheduled for today, grouped by category and
 * annotated with today's completion status. Drives the Today screen.
 */
export function useTodayQuests(): TodayQuestGroups | undefined {
  return useLiveQuery(async () => {
    const today = todayKey();
    const weekday = new Date().getDay();
    const quests = await db.quests.orderBy('createdAt').toArray();
    const todays = quests.filter(
      (q) =>
        q.isActive &&
        (q.type === 'daily' || q.type === 'recovery') &&
        scheduledOn(q, weekday),
    );
    const completions = await db.completions.where('date').equals(today).toArray();
    const byQuest = new Map(completions.map((c) => [c.questId, c]));

    const groups: TodayQuestGroups = { main: [], support: [], recovery: [] };
    for (const quest of todays) {
      const completion = byQuest.get(quest.id);
      const trackMode = habitTrackMode(quest);
      const targetCount = habitTargetCount(quest);
      const progress = habitProgressFromCompletion(quest, completion);
      const tq: TodayQuest = {
        quest,
        completion,
        completed: isHabitComplete(quest, completion),
        skipped: !!completion && completion.completionType === 'skip',
        trackMode,
        targetCount,
        progress,
      };
      const category: QuestCategory = quest.category ?? 'support';
      groups[category].push(tq);
    }
    return groups;
  });
}

/** Flat list of today's habits, sorted by creation time. */
export function useTodayHabits(): TodayQuest[] | undefined {
  const groups = useTodayQuests();
  if (!groups) return undefined;
  return [...groups.main, ...groups.support, ...groups.recovery].sort(
    (a, b) => a.quest.createdAt - b.quest.createdAt,
  );
}

/** Today's completions (including skips). */
export function useTodayCompletions(): Completion[] | undefined {
  return useLiveQuery(() =>
    db.completions.where('date').equals(todayKey()).toArray(),
  );
}

/** Completions within an inclusive range, or all completions when omitted. */
export function useCompletions(range?: DateRange): Completion[] | undefined {
  return useLiveQuery(
    () =>
      range
        ? db.completions
            .where('date')
            .between(range.start, range.end, true, true)
            .toArray()
        : db.completions.toArray(),
    [range?.start, range?.end],
  );
}

/** Live momentum derived from recent completions. */
export function useMomentum(): MomentumInfo | undefined {
  return useLiveQuery(async () => {
    const today = todayKey();
    const start = addDays(today, -(MOMENTUM_WINDOW_DAYS + 1));
    const recent = await db.completions
      .where('date')
      .between(start, today, true, true)
      .toArray();
    return computeMomentum(recent, today);
  });
}

/** The six skill paths, each bundled with its (live) nodes in order. */
export function useSkillTree(): SkillPathWithNodes[] | undefined {
  return useLiveQuery(async () => {
    const nodes = await db.skillNodes.toArray();
    return SKILL_PATHS.map((path) => ({
      path,
      nodes: nodes
        .filter((n) => n.pathId === path.id)
        .sort((a, b) => a.order - b.order),
    }));
  });
}

/** Saved weekly reviews, newest first. */
export function useReviews(): Review[] | undefined {
  return useLiveQuery(() =>
    db.reviews.orderBy('createdAt').reverse().toArray(),
  );
}

/** The energy check-in for a day (defaults to today). */
export function useEnergy(date?: string): EnergyCheckin | undefined {
  return useLiveQuery(
    () => db.energyCheckins.get(date ?? todayKey()),
    [date],
  );
}

/** Overall level view (level info + rank title + total XP) from the profile. */
export interface LevelView extends LevelInfo {
  rank: string;
  totalXP: number;
}

/** Derived overall level/rank from the profile's lifetime XP. */
export function useLevel(): LevelView | undefined {
  const profile = useProfile();
  if (!profile) return undefined;
  const info = levelFromXP(profile.totalXP);
  return { ...info, rank: rankTitle(info.level), totalXP: profile.totalXP };
}
