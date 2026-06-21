/**
 * Rank titles mapped to level ranges. `rankTitle` is the data source used by
 * `gamification.rankTitle` and the UI to label a player's overall level.
 */
import type { RankDef } from '../types';

export const RANKS: RankDef[] = [
  { minLevel: 1, maxLevel: 2, title: 'Novice' },
  { minLevel: 3, maxLevel: 4, title: 'Apprentice' },
  { minLevel: 5, maxLevel: 6, title: 'Adept' },
  { minLevel: 7, maxLevel: 9, title: 'Builder Apprentice' },
  { minLevel: 10, maxLevel: 13, title: 'Journeyman' },
  { minLevel: 14, maxLevel: 17, title: 'Expert' },
  { minLevel: 18, maxLevel: 22, title: 'Master' },
  { minLevel: 23, maxLevel: 28, title: 'Grandmaster' },
  { minLevel: 29, maxLevel: 35, title: 'Champion' },
  { minLevel: 36, maxLevel: 45, title: 'Hero' },
  { minLevel: 46, maxLevel: 59, title: 'Mythic' },
  { minLevel: 60, maxLevel: Infinity, title: 'Legend' },
];

/** The rank title for a given overall level (e.g. 7 → "Builder Apprentice"). */
export function rankTitle(level: number): string {
  const rank = RANKS.find((r) => level >= r.minLevel && level <= r.maxLevel);
  return rank?.title ?? 'Novice';
}
