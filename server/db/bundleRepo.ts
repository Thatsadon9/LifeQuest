/**
 * Map LifeQuest records ↔ Postgres rows (per-user).
 */
import type {
  Completion,
  EnergyCheckin,
  ExportBundle,
  Profile,
  Quest,
  Review,
  SkillNode,
  Stat,
} from '../../src/types/index.ts';

const EMPTY_BUNDLE = (): ExportBundle => ({
  version: 2,
  exportedAt: 0,
  profile: [],
  stats: [],
  quests: [],
  completions: [],
  skillNodes: [],
  energyCheckins: [],
  reviews: [],
});

export function rowsToBundle(rows: {
  profile: Record<string, unknown>[];
  stats: Record<string, unknown>[];
  quests: Record<string, unknown>[];
  completions: Record<string, unknown>[];
  skillNodes: Record<string, unknown>[];
  energyCheckins: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
}): ExportBundle {
  const hasAny =
    rows.profile.length +
      rows.stats.length +
      rows.quests.length +
      rows.completions.length +
      rows.skillNodes.length +
      rows.energyCheckins.length +
      rows.reviews.length >
    0;

  if (!hasAny) return EMPTY_BUNDLE();

  return {
    version: 2,
    exportedAt: Date.now(),
    profile: rows.profile.map(rowToProfile),
    stats: rows.stats.map(rowToStat),
    quests: rows.quests.map(rowToQuest),
    completions: rows.completions.map(rowToCompletion),
    skillNodes: rows.skillNodes.map(rowToSkillNode),
    energyCheckins: rows.energyCheckins.map(rowToEnergyCheckin),
    reviews: rows.reviews.map(rowToReview),
  };
}

function num(v: unknown): number {
  return typeof v === 'number' ? v : Number(v);
}

function str(v: unknown): string {
  return String(v ?? '');
}

function json<T>(v: unknown, fallback: T): T {
  if (v == null) return fallback;
  if (typeof v === 'string') {
    try {
      return JSON.parse(v) as T;
    } catch {
      return fallback;
    }
  }
  return v as T;
}

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    id: 1,
    name: str(row.name),
    totalXP: num(row.total_xp),
    theme: row.theme === 'dark' ? 'dark' : 'light',
    language: row.language === 'th' ? 'th' : 'en',
    createdAt: num(row.created_at),
    updatedAt: row.updated_at != null ? num(row.updated_at) : undefined,
  };
}

function rowToStat(row: Record<string, unknown>): Stat {
  return {
    key: str(row.key) as Stat['key'],
    xp: num(row.xp),
    level: num(row.level),
    description: str(row.description),
  };
}

function rowToQuest(row: Record<string, unknown>): Quest {
  return {
    id: str(row.id),
    title: str(row.title),
    description: str(row.description),
    type: str(row.type) as Quest['type'],
    difficulty: str(row.difficulty) as Quest['difficulty'],
    baseXP: num(row.base_xp),
    statTargets: json(row.stat_targets, []),
    minimumVersion: str(row.minimum_version),
    normalVersion: str(row.normal_version),
    heroVersion: str(row.hero_version),
    schedule: json(row.schedule, {}),
    trigger: str(row.trigger_text),
    isActive: Boolean(row.is_active),
    createdAt: num(row.created_at),
    category: row.category ? (str(row.category) as Quest['category']) : undefined,
    trackMode: row.track_mode ? (str(row.track_mode) as Quest['trackMode']) : undefined,
    targetCount: row.target_count != null ? num(row.target_count) : undefined,
    unit: row.unit ? str(row.unit) : undefined,
    updatedAt: row.updated_at != null ? num(row.updated_at) : undefined,
  };
}

function rowToCompletion(row: Record<string, unknown>): Completion {
  return {
    id: str(row.id),
    questId: str(row.quest_id),
    date: str(row.date),
    completionType: str(row.completion_type) as Completion['completionType'],
    xpAwarded: num(row.xp_awarded),
    statGains: json(row.stat_gains, {}),
    progress: row.progress != null ? num(row.progress) : undefined,
    createdAt: num(row.created_at),
  };
}

function rowToSkillNode(row: Record<string, unknown>): SkillNode {
  return {
    id: str(row.id),
    pathId: str(row.path_id),
    title: str(row.title),
    description: str(row.description),
    requirement: json(row.requirement, { kind: 'totalCompletions', value: 1 }),
    order: num(row.order),
    status: str(row.status) as SkillNode['status'],
  };
}

function rowToEnergyCheckin(row: Record<string, unknown>): EnergyCheckin {
  return {
    date: str(row.date),
    value: num(row.value),
  };
}

function rowToReview(row: Record<string, unknown>): Review {
  return {
    id: str(row.id),
    weekStart: str(row.week_start),
    weekEnd: str(row.week_end),
    snapshot: json(row.snapshot, {
      weekStart: str(row.week_start),
      weekEnd: str(row.week_end),
      totalXP: 0,
      completionRate: 0,
      completedCount: 0,
      skippedCount: 0,
      statXP: {},
      bestStat: null,
      neglectedStat: null,
      mostProductiveDay: null,
    }),
    answers: json(row.answers, { wentWell: '', lostMomentum: '', adjust: '' }),
    createdAt: num(row.created_at),
  };
}

export async function saveBundle(
  sql: {
    query: (query: string, params?: unknown[]) => Promise<unknown>;
  },
  userId: string,
  bundle: ExportBundle,
): Promise<void> {
  const profile = bundle.profile.slice(0, 1);
  const quests = [...new Map(bundle.quests.map((q) => [q.id, q])).values()];
  const completions = [
    ...new Map(
      bundle.completions.map((c) => [`${c.questId}\0${c.date}`, c] as const),
    ).values(),
  ];

  await sql.query(`DELETE FROM completions WHERE user_id = $1`, [userId]);
  await sql.query(`DELETE FROM quests WHERE user_id = $1`, [userId]);
  await sql.query(`DELETE FROM reviews WHERE user_id = $1`, [userId]);
  await sql.query(`DELETE FROM skill_nodes WHERE user_id = $1`, [userId]);
  await sql.query(`DELETE FROM energy_checkins WHERE user_id = $1`, [userId]);
  await sql.query(`DELETE FROM stats WHERE user_id = $1`, [userId]);
  await sql.query(`DELETE FROM profile WHERE user_id = $1`, [userId]);

  for (const p of profile) {
    await sql.query(
      `INSERT INTO profile (user_id, name, total_xp, theme, language, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, p.name, p.totalXP, p.theme, p.language, p.createdAt, p.updatedAt ?? p.createdAt],
    );
  }

  for (const s of bundle.stats) {
    await sql.query(
      `INSERT INTO stats (user_id, key, xp, level, description) VALUES ($1, $2, $3, $4, $5)`,
      [userId, s.key, s.xp, s.level, s.description],
    );
  }

  for (const q of quests) {
    await sql.query(
      `INSERT INTO quests (
        user_id, id, title, description, type, difficulty, base_xp, stat_targets,
        minimum_version, normal_version, hero_version, schedule, trigger_text,
        is_active, created_at, category, track_mode, target_count, unit, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20
      )`,
      [
        userId,
        q.id,
        q.title,
        q.description,
        q.type,
        q.difficulty,
        q.baseXP,
        JSON.stringify(q.statTargets),
        q.minimumVersion,
        q.normalVersion,
        q.heroVersion,
        JSON.stringify(q.schedule),
        q.trigger,
        q.isActive,
        q.createdAt,
        q.category ?? null,
        q.trackMode ?? null,
        q.targetCount ?? null,
        q.unit ?? null,
        q.updatedAt ?? q.createdAt,
      ],
    );
  }

  for (const c of completions) {
    await sql.query(
      `INSERT INTO completions (
        user_id, id, quest_id, date, completion_type, xp_awarded, stat_gains, progress, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        userId,
        c.id,
        c.questId,
        c.date,
        c.completionType,
        c.xpAwarded,
        JSON.stringify(c.statGains),
        c.progress ?? null,
        c.createdAt,
      ],
    );
  }

  for (const n of bundle.skillNodes) {
    await sql.query(
      `INSERT INTO skill_nodes (user_id, id, path_id, title, description, requirement, "order", status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        userId,
        n.id,
        n.pathId,
        n.title,
        n.description,
        JSON.stringify(n.requirement),
        n.order,
        n.status,
      ],
    );
  }

  for (const e of bundle.energyCheckins) {
    await sql.query(
      `INSERT INTO energy_checkins (user_id, date, value) VALUES ($1, $2, $3)`,
      [userId, e.date, e.value],
    );
  }

  for (const r of bundle.reviews) {
    await sql.query(
      `INSERT INTO reviews (user_id, id, week_start, week_end, snapshot, answers, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        userId,
        r.id,
        r.weekStart,
        r.weekEnd,
        JSON.stringify(r.snapshot),
        JSON.stringify(r.answers),
        r.createdAt,
      ],
    );
  }
}

export async function loadBundle(
  sql: {
    query: (query: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;
  },
  userId: string,
): Promise<ExportBundle> {
  const [profile, stats, quests, completions, skillNodes, energyCheckins, reviews] =
    await Promise.all([
      sql.query(`SELECT * FROM profile WHERE user_id = $1`, [userId]),
      sql.query(`SELECT * FROM stats WHERE user_id = $1`, [userId]),
      sql.query(`SELECT * FROM quests WHERE user_id = $1`, [userId]),
      sql.query(`SELECT * FROM completions WHERE user_id = $1`, [userId]),
      sql.query(`SELECT * FROM skill_nodes WHERE user_id = $1 ORDER BY "order"`, [userId]),
      sql.query(`SELECT * FROM energy_checkins WHERE user_id = $1`, [userId]),
      sql.query(`SELECT * FROM reviews WHERE user_id = $1`, [userId]),
    ]);

  return rowsToBundle({
    profile,
    stats,
    quests,
    completions,
    skillNodes,
    energyCheckins,
    reviews,
  });
}
