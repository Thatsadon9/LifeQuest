/**
 * Gamification engine — PURE functions only (no DB, no side effects).
 *
 * Everything here is deterministic given its inputs, which makes XP/level/
 * momentum behaviour easy to reason about and reuse from both `actions.ts`
 * (writes) and the read hooks (views).
 */
import type {
  Completion,
  Difficulty,
  HabitTrackMode,
  LevelInfo,
  MomentumInfo,
  MomentumStatus,
  Quest,
  ReviewSnapshot,
  SkillNode,
  SkillNodeStatus,
  SkillRequirement,
  Stat,
  StatKey,
} from '../types';
import { STAT_KEYS } from '../data/stats';
import { rankTitle as rankTitleData } from '../data/ranks';
import { addDays } from './date';

/* ============================================================================
 * Multipliers & XP
 * ========================================================================= */

/** XP multiplier for a quest's difficulty. */
export function difficultyMult(d: Difficulty): number {
  switch (d) {
    case 'easy':
      return 1;
    case 'medium':
      return 1.25;
    case 'hard':
      return 1.5;
    case 'heroic':
      return 2;
  }
}

/** XP multiplier for how a quest was completed (skips earn nothing). */
export function completionMult(t: Completion['completionType']): number {
  switch (t) {
    case 'minimum':
      return 0.5;
    case 'normal':
      return 1;
    case 'hero':
      return 1.5;
    case 'skip':
      return 0;
  }
}

/**
 * XP awarded for completing `quest` at the given tier.
 * `round(baseXP * difficultyMult * completionMult)`.
 */
export function questXP(
  quest: Pick<Quest, 'baseXP' | 'difficulty'>,
  type: Completion['completionType'],
): number {
  return Math.round(
    quest.baseXP * difficultyMult(quest.difficulty) * completionMult(type),
  );
}

/* ============================================================================
 * Habit tracking
 * ========================================================================= */

/** Resolved track mode (defaults to binary for legacy quests). */
export function habitTrackMode(quest: Pick<Quest, 'trackMode'>): HabitTrackMode {
  return quest.trackMode ?? 'binary';
}

/** Target count for a habit (1 for binary). */
export function habitTargetCount(quest: Pick<Quest, 'trackMode' | 'targetCount'>): number {
  if (habitTrackMode(quest) === 'counter') {
    return Math.max(1, Math.floor(quest.targetCount ?? 1));
  }
  return 1;
}

/** Current progress from today's completion record. */
export function habitProgressFromCompletion(
  quest: Pick<Quest, 'trackMode' | 'targetCount'>,
  completion: Completion | undefined,
): number {
  if (!completion || completion.completionType === 'skip') return 0;
  if (habitTrackMode(quest) === 'counter') {
    return completion.progress ?? 0;
  }
  return completion.xpAwarded > 0 ? 1 : 0;
}

/** Whether the habit target is fully met today. */
export function isHabitComplete(
  quest: Pick<Quest, 'trackMode' | 'targetCount'>,
  completion: Completion | undefined,
): boolean {
  if (!completion || completion.completionType === 'skip') return false;
  if (habitTrackMode(quest) === 'counter') {
    return (
      (completion.progress ?? 0) >= habitTargetCount(quest) && completion.xpAwarded > 0
    );
  }
  return completion.xpAwarded > 0;
}

/* ============================================================================
 * Overall level curve
 * ========================================================================= */

/** XP required to advance FROM `level` to `level + 1`: `100 + level * 50`. */
export function nextLevelXP(level: number): number {
  return 100 + level * 50;
}

/**
 * Derive overall level info from a lifetime XP total.
 * Level starts at 1; each level costs `nextLevelXP(level)`.
 */
export function levelFromXP(totalXP: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalXP || 0));
  while (remaining >= nextLevelXP(level)) {
    remaining -= nextLevelXP(level);
    level += 1;
  }
  const neededForNext = nextLevelXP(level);
  return {
    level,
    intoLevel: remaining,
    neededForNext,
    progress: neededForNext > 0 ? remaining / neededForNext : 0,
  };
}

/** Per-stat level curve — lighter than the overall curve: `50 + level * 30`. */
export function nextStatLevelXP(level: number): number {
  return 50 + level * 30;
}

/**
 * Derive a stat's level info from its accumulated stat XP.
 * Same shape as {@link levelFromXP} but using the lighter stat curve.
 */
export function statLevelFromXP(xp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, Math.floor(xp || 0));
  while (remaining >= nextStatLevelXP(level)) {
    remaining -= nextStatLevelXP(level);
    level += 1;
  }
  const neededForNext = nextStatLevelXP(level);
  return {
    level,
    intoLevel: remaining,
    neededForNext,
    progress: neededForNext > 0 ? remaining / neededForNext : 0,
  };
}

/** Title for an overall level (delegates to the rank table in `data/ranks`). */
export function rankTitle(level: number): string {
  return rankTitleData(level);
}

/* ============================================================================
 * Stat XP distribution
 * ========================================================================= */

/**
 * Split a quest's awarded XP across its target stats by weight.
 * Returns only positive gains; empty when the quest has no stat targets.
 */
export function distributeStatXP(
  quest: Pick<Quest, 'statTargets'>,
  totalXp: number,
): Partial<Record<StatKey, number>> {
  const out: Partial<Record<StatKey, number>> = {};
  const targets = quest.statTargets ?? [];
  const totalWeight = targets.reduce((s, t) => s + (t.weight || 0), 0);
  if (totalWeight <= 0 || totalXp <= 0) return out;
  for (const t of targets) {
    const gain = Math.round((totalXp * (t.weight || 0)) / totalWeight);
    if (gain > 0) out[t.stat] = (out[t.stat] ?? 0) + gain;
  }
  return out;
}

/* ============================================================================
 * Momentum
 * ========================================================================= */

/** Rolling window (in days) used for the momentum calculation. */
export const MOMENTUM_WINDOW_DAYS = 7;

const MOMENTUM = {
  /** Base points for the first real completion of a day. */
  dayBase: 20,
  /** Extra points per additional completion that day (diminishing). */
  perExtra: 6,
  /** Max additional completions counted per day. */
  extraCap: 3,
  /** Bonus for returning to action the day after a missed day. */
  comeback: 12,
  /** Multiplicative decay applied on a fully missed day. */
  missedDecay: 0.75,
  /** Small penalty + soft decay for an intentional skip day. */
  skipPenalty: 5,
  skipDecay: 0.95,
} as const;

/** Map a 0–100 momentum score to its status band. */
export function momentumStatus(score: number): MomentumStatus {
  if (score >= 80) return 'On Fire';
  if (score >= 50) return 'Flowing';
  if (score >= 25) return 'Warming Up';
  return 'Cold';
}

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

/**
 * Compute momentum from recent completions.
 *
 * Walks the last {@link MOMENTUM_WINDOW_DAYS} days oldest→newest:
 * completions raise the score (with diminishing returns), an intentional skip
 * lowers it slightly, and a fully missed day only *decays* the score (never
 * resets it). Coming back the day after a miss grants a comeback bonus. The
 * score is clamped to 0–100. `recoveryMode` is on when the score is low or
 * yesterday was missed — a cue to surface tiny recovery wins.
 *
 * @param completions any list of completions (filtered to the window internally)
 * @param today       the local `YYYY-MM-DD` "today" anchor
 */
export function computeMomentum(
  completions: Completion[],
  today: string,
): MomentumInfo {
  const windowStart = addDays(today, -(MOMENTUM_WINDOW_DAYS - 1));

  // Tally per-day completion / skip counts within the window.
  const doneByDay = new Map<string, number>();
  const skipByDay = new Map<string, number>();
  for (const c of completions) {
    if (c.date < windowStart || c.date > today) continue;
    if (c.completionType === 'skip') {
      skipByDay.set(c.date, (skipByDay.get(c.date) ?? 0) + 1);
    } else if (c.xpAwarded > 0) {
      doneByDay.set(c.date, (doneByDay.get(c.date) ?? 0) + 1);
    }
  }

  let score = 0;
  let prevMissed = false;
  for (let i = MOMENTUM_WINDOW_DAYS - 1; i >= 0; i--) {
    const day = addDays(today, -i);
    const done = doneByDay.get(day) ?? 0;
    const skipped = skipByDay.get(day) ?? 0;

    if (done > 0) {
      let gain = MOMENTUM.dayBase + Math.min(done - 1, MOMENTUM.extraCap) * MOMENTUM.perExtra;
      if (prevMissed) gain += MOMENTUM.comeback;
      score += gain;
      prevMissed = false;
    } else if (skipped > 0) {
      score = score * MOMENTUM.skipDecay - MOMENTUM.skipPenalty;
      prevMissed = false; // a skip is still engagement, not a silent miss
    } else {
      score *= MOMENTUM.missedDecay;
      prevMissed = true;
    }
    score = clamp(score, 0, 100);
  }

  const yesterdayMissed = (doneByDay.get(addDays(today, -1)) ?? 0) === 0;
  const recoveryMode = score < 30 || yesterdayMissed;

  return { score: Math.round(score), status: momentumStatus(score), recoveryMode };
}

/**
 * Suggest a few low-friction "tiny win" quests to rebuild momentum.
 * Prefers active recovery-category quests, then easy quests; caps at 3.
 */
export function recoverySuggestions(quests: Quest[]): Quest[] {
  const active = quests.filter((q) => q.isActive);
  const recovery = active.filter(
    (q) => q.category === 'recovery' || q.type === 'recovery',
  );
  const easy = active.filter(
    (q) => q.difficulty === 'easy' && q.category !== 'recovery' && q.type !== 'recovery',
  );
  return [...recovery, ...easy].slice(0, 3);
}

/* ============================================================================
 * Skill tree
 * ========================================================================= */

/** Context needed to evaluate a skill node's requirement. */
export interface SkillContext {
  /** Completions per quest id (non-skip). */
  questCompletions: Record<string, number>;
  /** Current level per stat. */
  statLevels: Partial<Record<StatKey, number>>;
  /** Total non-skip completions across all quests. */
  totalCompletions: number;
  /**
   * Whether the previous node in the same path is completed. When false the
   * node is locked; defaults to true (first node / no ordering context).
   */
  prevCompleted?: boolean;
}

/** Whether a requirement is satisfied by the given context. */
export function isRequirementMet(
  req: SkillRequirement,
  ctx: SkillContext,
): boolean {
  switch (req.kind) {
    case 'questCompletions':
      return (ctx.questCompletions[req.questId ?? ''] ?? 0) >= req.value;
    case 'statLevel':
      return (ctx.statLevels[req.stat ?? ('INT' as StatKey)] ?? 1) >= req.value;
    case 'totalCompletions':
      return ctx.totalCompletions >= req.value;
    default:
      return false;
  }
}

/**
 * Compute a skill node's status: `completed` when its requirement is met,
 * otherwise `unlocked` if the previous node is completed (or it's first),
 * else `locked`.
 */
export function computeSkillNodeStatus(
  node: Pick<SkillNode, 'requirement'>,
  ctx: SkillContext,
): SkillNodeStatus {
  if (isRequirementMet(node.requirement, ctx)) return 'completed';
  return ctx.prevCompleted === false ? 'locked' : 'unlocked';
}

/** Minimal node shape needed to compute statuses across a path. */
type NodeForStatus = Pick<SkillNode, 'id' | 'pathId' | 'order' | 'requirement'>;

/**
 * Compute statuses for many nodes at once, respecting per-path ordering:
 * within each path, nodes unlock sequentially (a node is `locked` until the
 * previous node is `completed`). Returns a map of node id → status. Pure.
 */
export function computeSkillStatuses(
  nodes: NodeForStatus[],
  base: Omit<SkillContext, 'prevCompleted'>,
): Record<string, SkillNodeStatus> {
  const byPath = new Map<string, NodeForStatus[]>();
  for (const n of nodes) {
    const arr = byPath.get(n.pathId);
    if (arr) arr.push(n);
    else byPath.set(n.pathId, [n]);
  }
  const result: Record<string, SkillNodeStatus> = {};
  for (const arr of byPath.values()) {
    const sorted = [...arr].sort((a, b) => a.order - b.order);
    let prevCompleted = true;
    for (const n of sorted) {
      const status = computeSkillNodeStatus(n, { ...base, prevCompleted });
      result[n.id] = status;
      prevCompleted = status === 'completed';
    }
  }
  return result;
}

/* ============================================================================
 * Weekly review
 * ========================================================================= */

/** Inputs for {@link buildWeeklyReview}. */
export interface WeeklyReviewInput {
  completions: Completion[];
  quests: Quest[];
  stats: Stat[];
}

/**
 * Compute the metrics snapshot for a week starting at `weekStart` (Monday).
 * Filters the provided completions to the week internally, so callers may pass
 * a broader list.
 */
export function buildWeeklyReview(
  weekStart: string,
  { completions, quests, stats }: WeeklyReviewInput,
): ReviewSnapshot {
  const weekEnd = addDays(weekStart, 6);
  const inWeek = completions.filter(
    (c) => c.date >= weekStart && c.date <= weekEnd,
  );

  const done = inWeek.filter((c) => c.completionType !== 'skip');
  const skipped = inWeek.filter((c) => c.completionType === 'skip');

  const totalXP = done.reduce((s, c) => s + (c.xpAwarded || 0), 0);

  // Expected actions ≈ active daily quests × 7.
  const activeDaily = quests.filter(
    (q) => q.isActive && q.type === 'daily',
  ).length;
  const expected = activeDaily * 7;
  const completionRate =
    expected > 0 ? clamp(done.length / expected, 0, 1) : 0;

  // Per-stat XP for the week.
  const statXP: Partial<Record<StatKey, number>> = {};
  for (const c of done) {
    for (const k of Object.keys(c.statGains) as StatKey[]) {
      statXP[k] = (statXP[k] ?? 0) + (c.statGains[k] ?? 0);
    }
  }

  // Best stat = most XP this week.
  let bestStat: StatKey | null = null;
  let bestXP = -1;
  for (const k of STAT_KEYS) {
    const v = statXP[k] ?? 0;
    if (v > bestXP) {
      bestXP = v;
      bestStat = v > 0 ? k : bestStat;
    }
  }

  // Neglected stat = least XP this week; tie-break by lowest overall level.
  const levelByStat = new Map<StatKey, number>(
    stats.map((s) => [s.key, s.level]),
  );
  let neglectedStat: StatKey | null = null;
  let worstXP = Infinity;
  let worstLevel = Infinity;
  for (const k of STAT_KEYS) {
    const v = statXP[k] ?? 0;
    const lvl = levelByStat.get(k) ?? 1;
    if (v < worstXP || (v === worstXP && lvl < worstLevel)) {
      worstXP = v;
      worstLevel = lvl;
      neglectedStat = k;
    }
  }

  // Most productive day by XP.
  const xpByDay = new Map<string, number>();
  for (const c of done) {
    xpByDay.set(c.date, (xpByDay.get(c.date) ?? 0) + (c.xpAwarded || 0));
  }
  let mostProductiveDay: string | null = null;
  let bestDayXP = 0;
  for (const [day, xp] of xpByDay) {
    if (xp > bestDayXP) {
      bestDayXP = xp;
      mostProductiveDay = day;
    }
  }

  return {
    weekStart,
    weekEnd,
    totalXP,
    completionRate,
    completedCount: done.length,
    skippedCount: skipped.length,
    statXP,
    bestStat,
    neglectedStat,
    mostProductiveDay,
  };
}
