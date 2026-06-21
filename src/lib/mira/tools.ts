/**
 * Execute Mira tool calls against local Dexie data via actions.ts.
 */
import { db } from '../db';
import { todayKey } from '../date';
import {
  completeHabit,
  completeQuest,
  createQuest,
  deleteQuest,
  incrementHabit,
  setEnergy,
  setProfileName,
  setQuestActive,
  skipQuest,
  uncompleteToday,
  updateQuest,
} from '../actions';
import {
  habitProgressFromCompletion,
  habitTargetCount,
  habitTrackMode,
  isHabitComplete,
  levelFromXP,
  rankTitle,
} from '../gamification';
import { localizeRankTitle } from '../../i18n/localize';
import { SKILL_PATHS } from '../../data/skillPaths';
import type {
  CompletionType,
  Difficulty,
  Language,
  QuestCategory,
  QuestType,
  StatKey,
} from '../../types';
import type { MiraFunctionCall, MiraFunctionResult, MiraToolOptions } from './types';

const STAT_KEYS = new Set(['INT', 'FOCUS', 'STR', 'WIS', 'CHA', 'CRAFT', 'COIN']);
const ROUTES = new Set(['/', '/quests', '/character', '/skills', '/mira', '/review', '/settings']);

function str(v: unknown): string {
  return String(v ?? '').trim();
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function statKey(v: unknown): StatKey | null {
  const k = str(v).toUpperCase();
  return STAT_KEYS.has(k) ? (k as StatKey) : null;
}

async function todayHabitsDetail() {
  const today = todayKey();
  const weekday = new Date().getDay();
  const quests = await db.quests.toArray();
  const completions = await db.completions.where('date').equals(today).toArray();
  const byQuest = new Map(completions.map((c) => [c.questId, c]));

  const scheduled = quests.filter(
    (q) =>
      q.isActive &&
      (q.type === 'daily' || q.type === 'recovery') &&
      (!q.schedule?.days?.length || q.schedule.days.includes(weekday)),
  );

  let done = 0;
  let skipped = 0;
  let pending = 0;
  let todayXP = 0;

  const items = scheduled.map((quest) => {
    const c = byQuest.get(quest.id);
    const completed = isHabitComplete(quest, c);
    const isSkipped = !!c && c.completionType === 'skip';
    if (completed) done += 1;
    else if (isSkipped) skipped += 1;
    else pending += 1;
    todayXP += c?.xpAwarded ?? 0;

    return {
      id: quest.id,
      title: quest.title,
      completed,
      skipped: isSkipped,
      trackMode: habitTrackMode(quest),
      progress: habitProgressFromCompletion(quest, c),
      targetCount: habitTargetCount(quest),
      xpAwarded: c?.xpAwarded ?? 0,
    };
  });

  return {
    date: today,
    total: scheduled.length,
    completed: done,
    skipped,
    pending,
    todayXP,
    habits: items,
  };
}

export async function executeMiraTool(
  call: MiraFunctionCall,
  locale: Language,
  options: MiraToolOptions = {},
): Promise<MiraFunctionResult> {
  try {
    const result = await runTool(call, locale, options);
    return { name: call.name, response: { ok: true, ...result }, callId: call.callId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { name: call.name, response: { ok: false, error: message }, callId: call.callId };
  }
}

async function runTool(
  call: MiraFunctionCall,
  locale: Language,
  options: MiraToolOptions,
): Promise<Record<string, unknown>> {
  const args = call.args;

  switch (call.name) {
    case 'get_today_summary':
      return { summary: await todayHabitsDetail() };

    case 'get_character_summary': {
      const profile = await db.profile.get(1);
      const stats = await db.stats.toArray();
      const totalXP = profile?.totalXP ?? 0;
      const level = levelFromXP(totalXP);
      return {
        name: profile?.name,
        level: level.level,
        rank: localizeRankTitle(rankTitle(level.level), locale),
        totalXP,
        xpToNext: level.neededForNext - level.intoLevel,
        stats: stats.map((s) => ({
          key: s.key,
          level: s.level,
          xp: s.xp,
        })),
      };
    }

    case 'list_quests': {
      let quests = await db.quests.orderBy('createdAt').toArray();
      if (args.activeOnly === true) quests = quests.filter((q) => q.isActive);
      const type = str(args.type);
      if (type) quests = quests.filter((q) => q.type === type);
      const search = str(args.search).toLowerCase();
      if (search) {
        quests = quests.filter(
          (q) =>
            q.title.toLowerCase().includes(search) ||
            q.description.toLowerCase().includes(search),
        );
      }
      return {
        quests: quests.map((q) => ({
          id: q.id,
          title: q.title,
          type: q.type,
          difficulty: q.difficulty,
          isActive: q.isActive,
          baseXP: q.baseXP,
          trackMode: q.trackMode ?? 'binary',
        })),
      };
    }

    case 'get_quest': {
      const quest = await db.quests.get(str(args.questId));
      if (!quest) throw new Error('Quest not found');
      return { quest };
    }

    case 'create_quest': {
      const title = str(args.title);
      if (!title) throw new Error('title is required');
      const stat = statKey(args.stat) ?? 'WIS';
      const weight = num(args.statWeight, 1);
      const quest = await createQuest({
        title,
        description: str(args.description),
        type: (str(args.type) || 'daily') as QuestType,
        difficulty: (str(args.difficulty) || 'medium') as Difficulty,
        baseXP: num(args.baseXP, 15),
        statTargets: [{ stat, weight }],
        minimumVersion: str(args.minimumVersion) || 'Minimum effort',
        normalVersion: str(args.normalVersion) || 'Done',
        heroVersion: str(args.heroVersion) || 'Crushed it',
        trigger: str(args.trigger) || 'Anytime',
        category: (str(args.category) || 'support') as QuestCategory,
        trackMode: str(args.trackMode) === 'counter' ? 'counter' : 'binary',
        targetCount: args.targetCount != null ? num(args.targetCount) : undefined,
        unit: str(args.unit) || undefined,
        isActive: args.isActive !== false,
      });
      return { quest: { id: quest.id, title: quest.title } };
    }

    case 'update_quest': {
      const questId = str(args.questId);
      if (!questId) throw new Error('questId is required');
      const patch: Record<string, unknown> = {};
      if (args.title != null) patch.title = str(args.title);
      if (args.description != null) patch.description = str(args.description);
      if (args.type != null) patch.type = str(args.type);
      if (args.difficulty != null) patch.difficulty = str(args.difficulty);
      if (args.baseXP != null) patch.baseXP = num(args.baseXP);
      if (args.minimumVersion != null) patch.minimumVersion = str(args.minimumVersion);
      if (args.normalVersion != null) patch.normalVersion = str(args.normalVersion);
      if (args.heroVersion != null) patch.heroVersion = str(args.heroVersion);
      if (args.trigger != null) patch.trigger = str(args.trigger);
      if (args.category != null) patch.category = str(args.category);
      if (args.trackMode != null) patch.trackMode = str(args.trackMode);
      if (args.targetCount != null) patch.targetCount = num(args.targetCount);
      if (args.unit != null) patch.unit = str(args.unit);
      if (args.isActive != null) patch.isActive = Boolean(args.isActive);
      if (args.stat != null) {
        const sk = statKey(args.stat);
        if (sk) patch.statTargets = [{ stat: sk, weight: num(args.statWeight, 1) }];
      }
      await updateQuest(questId, patch);
      return { questId, updated: Object.keys(patch) };
    }

    case 'delete_quest': {
      const questId = str(args.questId);
      if (!Boolean(args.confirmed)) {
        throw new Error(
          'Deletion requires explicit user confirmation in chat. Ask the user to confirm, then call again with confirmed: true.',
        );
      }
      await deleteQuest(questId);
      return { deleted: questId };
    }

    case 'set_quest_active': {
      const questId = str(args.questId);
      await setQuestActive(questId, Boolean(args.active));
      return { questId, active: Boolean(args.active) };
    }

    case 'complete_habit': {
      const questId = str(args.questId);
      const tier = (str(args.tier) || 'normal') as Exclude<CompletionType, 'skip'>;
      if (tier === 'normal') {
        const r = await completeHabit(questId);
        return { xpAwarded: r.xpAwarded, statLevelUps: r.statLevelUps };
      }
      const r = await completeQuest(questId, tier);
      return { xpAwarded: r.xpAwarded, statLevelUps: r.statLevelUps };
    }

    case 'increment_habit': {
      const r = await incrementHabit(str(args.questId));
      return {
        progress: r.progress,
        targetCount: r.targetCount,
        completed: r.completed,
        xpAwarded: r.reward?.xpAwarded ?? 0,
      };
    }

    case 'skip_habit':
      await skipQuest(str(args.questId));
      return { skipped: str(args.questId) };

    case 'undo_habit_today':
      await uncompleteToday(str(args.questId));
      return { undone: str(args.questId) };

    case 'set_energy': {
      const checkin = await setEnergy(todayKey(), num(args.value, 3));
      return { date: checkin.date, value: checkin.value };
    }

    case 'set_profile_name':
      await setProfileName(str(args.name));
      return { name: str(args.name) };

    case 'get_skill_tree_summary': {
      const nodes = await db.skillNodes.toArray();
      const paths = SKILL_PATHS.map((path) => {
        const pathNodes = nodes.filter((n) => n.pathId === path.id);
        const completed = pathNodes.filter((n) => n.status === 'completed').length;
        return {
          pathId: path.id,
          name: path.name,
          completed,
          total: pathNodes.length,
        };
      });
      return { paths };
    }

    case 'navigate_to': {
      const path = str(args.path);
      if (!ROUTES.has(path)) throw new Error(`Invalid path. Use one of: ${[...ROUTES].join(', ')}`);
      options.navigate?.(path);
      return { navigated: path };
    }

    default:
      throw new Error(`Unknown tool: ${call.name}`);
  }
}

export async function executeMiraTools(
  calls: MiraFunctionCall[],
  locale: Language,
  options: MiraToolOptions = {},
): Promise<MiraFunctionResult[]> {
  const results: MiraFunctionResult[] = [];
  for (const call of calls) {
    results.push(await executeMiraTool(call, locale, options));
  }
  return results;
}
