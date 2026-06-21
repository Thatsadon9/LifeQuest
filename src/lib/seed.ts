/**
 * First-run seeding. `ensureSeeded` is idempotent — it only populates the DB
 * when it is empty, so it is safe to call on every app start.
 */
import { db } from './db';
import { STATS } from '../data/stats';
import { SEED_QUESTS } from '../data/seedQuests';
import { SKILL_NODE_SEEDS } from '../data/skillPaths';
import { computeSkillStatuses } from './gamification';
import type { Profile, SkillNode, Stat, StatKey } from '../types';

/**
 * Populate the database with starter content on first run:
 * profile, the 7 stats, seed quests, and the full skill tree (with initial
 * statuses computed). No-op if already seeded.
 */
export async function ensureSeeded(): Promise<void> {
  if ((await db.profile.count()) > 0) return;

  await db.transaction(
    'rw',
    db.profile,
    db.stats,
    db.quests,
    db.skillNodes,
    async () => {
      // Re-check inside the transaction to stay idempotent under races.
      if ((await db.profile.count()) > 0) return;

      const now = Date.now();

      const profile: Profile = {
        id: 1,
        name: 'Hero',
        totalXP: 0,
        theme: 'light',
        language: 'en',
        createdAt: now,
        updatedAt: now,
      };
      await db.profile.put(profile);

      const stats: Stat[] = STATS.map((s) => ({
        key: s.key,
        xp: 0,
        level: 1,
        description: s.description,
      }));
      await db.stats.bulkPut(stats);

      await db.quests.bulkPut(SEED_QUESTS);

      const statLevels = Object.fromEntries(
        STATS.map((s) => [s.key, 1]),
      ) as Partial<Record<StatKey, number>>;
      const statuses = computeSkillStatuses(SKILL_NODE_SEEDS, {
        questCompletions: {},
        statLevels,
        totalCompletions: 0,
      });
      const nodes: SkillNode[] = SKILL_NODE_SEEDS.map((n) => ({
        ...n,
        status: statuses[n.id] ?? 'locked',
      }));
      await db.skillNodes.bulkPut(nodes);
    },
  );
}
