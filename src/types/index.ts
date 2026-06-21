/**
 * LifeQuest — app-wide type contract.
 *
 * This file is the single source of truth for every shape used across the app:
 * persisted DB records, static data definitions, gamification view-models, and
 * UI helper types. Feature pages should import from here rather than redefining.
 */

/* ============================================================================
 * Primitive unions
 * ========================================================================= */

/** The seven character stats. */
export type StatKey = 'INT' | 'FOCUS' | 'STR' | 'WIS' | 'CHA' | 'CRAFT' | 'COIN';

/** Quest difficulty — drives the XP multiplier (see `difficultyMult`). */
export type Difficulty = 'easy' | 'medium' | 'hard' | 'heroic';

/** Quest cadence / kind. */
export type QuestType = 'daily' | 'weekly' | 'one-time' | 'recovery';

/**
 * How a quest was completed on a given day.
 * `minimum` / `normal` / `hero` award 50% / 100% / 150% XP respectively;
 * `skip` records an intentional skip (no XP, softens momentum decay).
 */
export type CompletionType = 'minimum' | 'normal' | 'hero' | 'skip';

/** Momentum bands derived from the momentum score (0–100). */
export type MomentumStatus = 'Cold' | 'Warming Up' | 'Flowing' | 'On Fire';

/** Colour theme. Default is light. */
export type Theme = 'dark' | 'light';

/** UI language. */
export type Language = 'en' | 'th';

/** Quest grouping shown on the Today screen. */
export type QuestCategory = 'main' | 'support' | 'recovery';

/** How a daily habit is tracked on the Today screen. */
export type HabitTrackMode = 'binary' | 'counter';

/** Lifecycle of a skill-tree node. */
export type SkillNodeStatus = 'locked' | 'unlocked' | 'completed';

/* ============================================================================
 * Persisted records (Dexie tables — see src/lib/db.ts)
 * ========================================================================= */

/** Singleton player profile (always stored with `id = 1`). */
export interface Profile {
  /** Primary key — always 1 (single-player app). */
  id: number;
  name: string;
  /** Lifetime experience points; drives overall level & rank. */
  totalXP: number;
  theme: Theme;
  language: Language;
  /** Epoch milliseconds. */
  createdAt: number;
  /** Last profile edit (name, theme, language, XP). */
  updatedAt?: number;
}

/** A single character stat and its accumulated XP / level. */
export interface Stat {
  key: StatKey;
  xp: number;
  level: number;
  description: string;
}

/** A weighted contribution of a quest's XP into a given stat. */
export interface StatTarget {
  stat: StatKey;
  /** Relative weight; XP is split across targets proportionally. */
  weight: number;
}

/** Optional recurrence info for a quest. */
export interface QuestSchedule {
  /**
   * Weekday numbers (0 = Sunday … 6 = Saturday) the quest is active.
   * Empty or undefined means "every day".
   */
  days?: number[];
}

/** A quest / habit definition. */
export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  difficulty: Difficulty;
  /** Base XP before difficulty / completion multipliers. */
  baseXP: number;
  /** Which stats this quest feeds, and by what weight. */
  statTargets: StatTarget[];
  /** Microcopy for the 50% tier, e.g. "Speak for 2 minutes". */
  minimumVersion: string;
  /** Microcopy for the 100% tier, e.g. "Practice for 15 minutes". */
  normalVersion: string;
  /** Microcopy for the 150% tier, e.g. "Record a 5-minute mock answer". */
  heroVersion: string;
  schedule: QuestSchedule;
  /** Habit cue / implementation-intention, e.g. "After breakfast". */
  trigger: string;
  isActive: boolean;
  createdAt: number;
  /** Today-screen grouping. Optional; defaults to "support" when absent. */
  category?: QuestCategory;
  /** Daily tracking mode — defaults to `binary`. */
  trackMode?: HabitTrackMode;
  /** Target count for `counter` habits (e.g. 8 glasses). */
  targetCount?: number;
  /** Optional unit label for counter display (e.g. "glasses"). */
  unit?: string;
  /** Last quest edit. */
  updatedAt?: number;
}

/** A record that a quest was acted on (completed/skipped) on a specific day. */
export interface Completion {
  id: string;
  questId: string;
  /** Local calendar day, `YYYY-MM-DD`. */
  date: string;
  completionType: CompletionType;
  /** XP actually granted (0 for skips). */
  xpAwarded: number;
  /** Per-stat XP granted by this completion. */
  statGains: Partial<Record<StatKey, number>>;
  /** Counter habit progress for the day (before/at target). */
  progress?: number;
  createdAt: number;
}

/** Condition that unlocks/completes a skill node. */
export interface SkillRequirement {
  kind: 'questCompletions' | 'statLevel' | 'totalCompletions';
  /** Required for `kind: 'questCompletions'`. */
  questId?: string;
  /** Required for `kind: 'statLevel'`. */
  stat?: StatKey;
  /** Threshold: completion count, stat level, or total completions. */
  value: number;
}

/** A node in a skill path (the skill tree). */
export interface SkillNode {
  id: string;
  pathId: string;
  title: string;
  description: string;
  requirement: SkillRequirement;
  /** Position within the path (ascending). */
  order: number;
  status: SkillNodeStatus;
}

/** A daily energy self-rating (1–5). Primary key is `date`. */
export interface EnergyCheckin {
  /** Local `YYYY-MM-DD`. */
  date: string;
  /** 1 (depleted) … 5 (energised). */
  value: number;
}

/** Reflection answers captured in a weekly review. */
export interface ReviewAnswers {
  wentWell: string;
  lostMomentum: string;
  adjust: string;
}

/** Computed metrics snapshot stored alongside a weekly review. */
export interface ReviewSnapshot {
  weekStart: string;
  weekEnd: string;
  totalXP: number;
  /** 0–1 fraction of scheduled actions completed (non-skip). */
  completionRate: number;
  completedCount: number;
  skippedCount: number;
  /** XP earned per stat during the week. */
  statXP: Partial<Record<StatKey, number>>;
  bestStat: StatKey | null;
  neglectedStat: StatKey | null;
  /** Local `YYYY-MM-DD` of the highest-XP day, or null. */
  mostProductiveDay: string | null;
}

/** A saved weekly review. */
export interface Review {
  id: string;
  weekStart: string;
  weekEnd: string;
  snapshot: ReviewSnapshot;
  answers: ReviewAnswers;
  createdAt: number;
}

/* ============================================================================
 * Static data definitions (src/data/*)
 * ========================================================================= */

/** Static definition of a stat (icon, colour, copy). */
export interface StatDef {
  key: StatKey;
  name: string;
  /** lucide-react icon name (PascalCase), e.g. "Brain". */
  icon: string;
  /** Design-token name, e.g. "int" → `var(--color-int)` / `text-int`. */
  colorToken: string;
  /** Concrete hex (mirrors the CSS token) for inline styles / charts. */
  color: string;
  description: string;
}

/** A rank band mapped to a level range. */
export interface RankDef {
  minLevel: number;
  /** Inclusive upper bound; `Infinity` for the final rank. */
  maxLevel: number;
  title: string;
}

/** Static definition of a skill path (a column in the skill tree). */
export interface SkillPathDef {
  id: string;
  name: string;
  description: string;
  /** lucide-react icon name (PascalCase). */
  icon: string;
  /** Design-token name or hex used for the path accent. */
  color: string;
}

/* ============================================================================
 * Gamification view-models
 * ========================================================================= */

/** Level breakdown derived from an XP total. */
export interface LevelInfo {
  level: number;
  /** XP accumulated within the current level. */
  intoLevel: number;
  /** XP required to advance from the current level to the next. */
  neededForNext: number;
  /** 0–1 progress toward the next level. */
  progress: number;
}

/** Momentum view-model derived from recent completions. */
export interface MomentumInfo {
  /** 0–100. */
  score: number;
  status: MomentumStatus;
  /** True when the player should be nudged toward tiny recovery wins. */
  recoveryMode: boolean;
}

/* ============================================================================
 * UI helper types
 * ========================================================================= */

/** A quest annotated with today's completion status (used by `useTodayQuests`). */
export interface TodayQuest {
  quest: Quest;
  /** Today's completion record, if the quest was acted on. */
  completion?: Completion;
  /** True if the habit target is met today. */
  completed: boolean;
  /** True if explicitly skipped today. */
  skipped: boolean;
  trackMode: HabitTrackMode;
  targetCount: number;
  /** Current count toward target (counter) or 0/1 (binary). */
  progress: number;
}

/** Active daily quests grouped by category for the Today screen. */
export interface TodayQuestGroups {
  main: TodayQuest[];
  support: TodayQuest[];
  recovery: TodayQuest[];
}

/** A skill path bundled with its (live) nodes — returned by `useSkillTree`. */
export interface SkillPathWithNodes {
  path: SkillPathDef;
  nodes: SkillNode[];
}

/** Visual variants for toast notifications. */
export type ToastVariant =
  | 'default'
  | 'success'
  | 'levelup'
  | 'warning'
  | 'danger'
  | 'info';

/** A queued toast notification. */
export interface Toast {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
}

/** Input accepted by `useToast().toast(...)` (id & variant are optional). */
export interface ToastInput {
  title: string;
  message?: string;
  /** Defaults to `'default'`. */
  variant?: ToastVariant;
  /** Optional explicit id; generated when omitted. */
  id?: string;
}

/**
 * Result returned by `completeQuest`, used to drive celebratory toasts.
 */
export interface CompleteQuestResult {
  xpAwarded: number;
  leveledUp: boolean;
  newLevel: number;
  /** Stats that gained a level from this completion. */
  statLevelUps: StatKey[];
  /** Titles of skill nodes newly unlocked/completed by this completion. */
  unlockedNodeTitles: string[];
  /** True when the hero tier was used. */
  heroBonus: boolean;
}

/** Serialised export bundle produced by `exportData` / consumed by `importData`. */
export interface ExportBundle {
  version: number;
  exportedAt: number;
  profile: Profile[];
  stats: Stat[];
  quests: Quest[];
  completions: Completion[];
  skillNodes: SkillNode[];
  energyCheckins: EnergyCheckin[];
  reviews: Review[];
}

/** Pending deletions sent on the next sync. */
export interface SyncDeletions {
  quests?: string[];
  completions?: string[];
  reviews?: string[];
}

/** Cloud sync request body. */
export interface SyncRequest {
  bundle: ExportBundle;
  deletions?: SyncDeletions;
}

/** Cloud sync response. */
export interface SyncResponse {
  bundle: ExportBundle;
  exportedAt: number;
}

/** Authenticated account (server session). */
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}
