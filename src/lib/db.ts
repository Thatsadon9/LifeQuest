/**
 * Dexie database for LifeQuest.
 *
 * All persistence lives here. Tables are reactive via `dexie-react-hooks`
 * (`useLiveQuery`), so any mutation in `actions.ts` re-renders the UI.
 * Import the `db` singleton; do not construct `LifeQuestDB` elsewhere.
 */
import Dexie, { type Table } from 'dexie';
import type {
  Completion,
  EnergyCheckin,
  Profile,
  Quest,
  Review,
  SkillNode,
  Stat,
} from '../types';

export class LifeQuestDB extends Dexie {
  // `declare` = pure type info, no field emit. This is important: it lets Dexie
  // wire up the table accessors at runtime without a class field shadowing them.
  declare profile: Table<Profile, number>;
  declare stats: Table<Stat, string>;
  declare quests: Table<Quest, string>;
  declare completions: Table<Completion, string>;
  declare skillNodes: Table<SkillNode, string>;
  declare energyCheckins: Table<EnergyCheckin, string>;
  declare reviews: Table<Review, string>;

  constructor() {
    super('LifeQuestDB');
    const stores = {
      // Singleton profile keyed by id (= 1).
      profile: 'id',
      // Stats keyed by their StatKey.
      stats: 'key',
      // Quests: pk id; indexed by type / category / createdAt for listing.
      // (isActive is a boolean and intentionally not indexed — filtered in JS.)
      quests: 'id, type, category, createdAt',
      // Completions: compound [questId+date] enforces once-per-day lookups;
      // date & questId support range/per-quest queries.
      completions: 'id, questId, date, [questId+date], completionType, createdAt',
      // Skill nodes: pk id; indexed by path / status / order.
      skillNodes: 'id, pathId, status, order',
      // Energy check-ins: one per day — date is the unique primary key.
      energyCheckins: '&date',
      // Reviews: pk id; indexed by week & recency.
      reviews: 'id, weekStart, createdAt',
    };

    this.version(1).stores({
      ...stores,
      bosses: 'id, status, weekStart',
    });
    this.version(2)
      .stores({
        ...stores,
        bosses: 'id, status, weekStart',
      })
      .upgrade(async (tx) => {
        await tx
          .table('profile')
          .toCollection()
          .modify((profile: Profile) => {
            if (!profile.language) profile.language = 'en';
          });
      });
    this.version(3)
      .stores({
        ...stores,
        bosses: 'id, status, weekStart',
      })
      .upgrade(async (tx) => {
        const now = Date.now();
        await tx
          .table('profile')
          .toCollection()
          .modify((profile: Profile) => {
            if (!profile.updatedAt) profile.updatedAt = profile.createdAt ?? now;
          });
        await tx
          .table('quests')
          .toCollection()
          .modify((quest: Quest) => {
            if (!quest.updatedAt) quest.updatedAt = quest.createdAt ?? now;
          });
      });
    this.version(4).stores(stores);
  }
}

/** Singleton database instance — import this everywhere. */
export const db = new LifeQuestDB();

/** All stores — use for read/write transactions that touch multiple tables. */
export const RW_STORES = [
  db.profile,
  db.stats,
  db.quests,
  db.completions,
  db.skillNodes,
  db.energyCheckins,
  db.reviews,
] as const;
