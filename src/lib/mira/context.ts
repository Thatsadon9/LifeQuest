/**
 * Build a compact game snapshot for Mira's system prompt.
 */
import { db } from '../db';
import { todayKey } from '../date';
import {
  computeMomentum,
  habitProgressFromCompletion,
  habitTargetCount,
  habitTrackMode,
  isHabitComplete,
  levelFromXP,
  rankTitle,
  MOMENTUM_WINDOW_DAYS,
} from '../gamification';
import { localizeRankTitle } from '../../i18n/localize';
import { addDays } from '../date';
import type { Language, Quest } from '../../types';
import type { MiraGameContext } from './types';

function scheduledOn(quest: Quest, weekday: number): boolean {
  const days = quest.schedule?.days;
  return !days || days.length === 0 || days.includes(weekday);
}

export async function buildMiraContext(locale: Language): Promise<MiraGameContext> {
  const today = todayKey();
  const weekday = new Date().getDay();
  const profile = await db.profile.get(1);
  const quests = await db.quests.toArray();
  const completionsToday = await db.completions.where('date').equals(today).toArray();
  const energy = await db.energyCheckins.get(today);

  const windowStart = addDays(today, -(MOMENTUM_WINDOW_DAYS - 1));
  const recentCompletions = await db.completions
    .where('date')
    .between(windowStart, today, true, true)
    .toArray();
  const momentum = computeMomentum(recentCompletions, today);

  const totalXP = profile?.totalXP ?? 0;
  const level = levelFromXP(totalXP);

  const todaysQuests = quests.filter(
    (q) =>
      q.isActive &&
      (q.type === 'daily' || q.type === 'recovery') &&
      scheduledOn(q, weekday),
  );
  const byQuest = new Map(completionsToday.map((c) => [c.questId, c]));

  const habitsToday = todaysQuests.map((quest) => {
    const completion = byQuest.get(quest.id);
    const trackMode = habitTrackMode(quest);
    const targetCount = habitTargetCount(quest);
    return {
      id: quest.id,
      title: quest.title,
      completed: isHabitComplete(quest, completion),
      skipped: !!completion && completion.completionType === 'skip',
      progress: habitProgressFromCompletion(quest, completion),
      targetCount: trackMode === 'counter' ? targetCount : undefined,
      trackMode,
    };
  });

  const todayXP = completionsToday.reduce((s, c) => s + c.xpAwarded, 0);

  return {
    today,
    locale,
    playerName: profile?.name ?? 'Hero',
    level: level.level,
    rank: localizeRankTitle(rankTitle(level.level), locale),
    totalXP,
    todayXP,
    momentumScore: momentum.score,
    recoveryMode: momentum.recoveryMode,
    energyToday: energy?.value ?? null,
    habitsToday,
    questCount: quests.length,
    activeQuestCount: quests.filter((q) => q.isActive).length,
  };
}
