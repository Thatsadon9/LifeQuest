/**
 * Today habit list ordering — pending first, done/skipped at bottom; user sort within buckets.
 */
import { localizeQuest } from '../i18n/localize';
import { questXP } from './gamification';
import type { Difficulty, Language, QuestCategory, TodayQuest } from '../types';

export type TodayHabitSortMode = 'default' | 'difficulty' | 'xp' | 'name' | 'category';

const SORT_STORAGE_KEY = 'lifequest-today-habit-sort';

const DIFFICULTY_RANK: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
  heroic: 4,
};

const CATEGORY_RANK: Record<QuestCategory, number> = {
  main: 0,
  support: 1,
  recovery: 2,
};

/** Status bucket: pending → completed → skipped (all sink to the bottom). */
function statusBucket(h: TodayQuest): number {
  if (h.skipped) return 2;
  if (h.completed) return 1;
  return 0;
}

function compareDefault(a: TodayQuest, b: TodayQuest): number {
  return a.quest.createdAt - b.quest.createdAt;
}

function compareDifficulty(a: TodayQuest, b: TodayQuest): number {
  const diff =
    DIFFICULTY_RANK[b.quest.difficulty] - DIFFICULTY_RANK[a.quest.difficulty];
  return diff !== 0 ? diff : compareDefault(a, b);
}

function compareXp(a: TodayQuest, b: TodayQuest): number {
  const diff = questXP(b.quest, 'normal') - questXP(a.quest, 'normal');
  return diff !== 0 ? diff : compareDefault(a, b);
}

function compareCategory(a: TodayQuest, b: TodayQuest): number {
  const catA = a.quest.category ?? 'support';
  const catB = b.quest.category ?? 'support';
  const diff = CATEGORY_RANK[catA] - CATEGORY_RANK[catB];
  return diff !== 0 ? diff : compareDefault(a, b);
}

function compareName(a: TodayQuest, b: TodayQuest, locale: Language): number {
  const titleA = localizeQuest(a.quest, locale).title;
  const titleB = localizeQuest(b.quest, locale).title;
  return titleA.localeCompare(titleB, locale === 'th' ? 'th' : 'en', { sensitivity: 'base' });
}

const MODE_COMPARE: Record<
  Exclude<TodayHabitSortMode, 'name'>,
  (a: TodayQuest, b: TodayQuest) => number
> = {
  default: compareDefault,
  difficulty: compareDifficulty,
  xp: compareXp,
  category: compareCategory,
};

export function sortTodayHabits(
  habits: TodayQuest[],
  mode: TodayHabitSortMode,
  locale: Language,
): TodayQuest[] {
  const within =
    mode === 'name'
      ? (a: TodayQuest, b: TodayQuest) => compareName(a, b, locale)
      : MODE_COMPARE[mode];

  return [...habits].sort((a, b) => {
    const bucket = statusBucket(a) - statusBucket(b);
    if (bucket !== 0) return bucket;
    return within(a, b);
  });
}

export function loadTodayHabitSortMode(): TodayHabitSortMode {
  try {
    const raw = localStorage.getItem(SORT_STORAGE_KEY);
    if (
      raw === 'default' ||
      raw === 'difficulty' ||
      raw === 'xp' ||
      raw === 'name' ||
      raw === 'category'
    ) {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return 'difficulty';
}

export function saveTodayHabitSortMode(mode: TodayHabitSortMode): void {
  try {
    localStorage.setItem(SORT_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export const TODAY_HABIT_SORT_MODES: TodayHabitSortMode[] = [
  'default',
  'difficulty',
  'xp',
  'name',
  'category',
];
