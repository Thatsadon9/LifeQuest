/**
 * HabitCard — daily habit on the Today board (binary check or counter +1).
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Minus, Plus, RotateCcw, SkipForward, Timer } from 'lucide-react';
import {
  completeHabit,
  decrementHabit,
  incrementHabit,
  skipQuest,
  uncompleteToday,
} from '../lib/actions';
import { questXP } from '../lib/gamification';
import { localizeQuest, localizeStatName } from '../i18n/localize';
import { useLanguage, useT, useToast } from '../hooks';
import { STAT_BY_KEY } from '../data/stats';
import { StatIcon } from './StatIcon';
import { DifficultyBadge } from './questMeta';
import type { CompleteQuestResult, StatKey, TodayQuest } from '../types';

function pickStable(id: string, list: string[]): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return list[Math.abs(h) % list.length];
}

export interface HabitCardProps {
  todayQuest: TodayQuest;
  index?: number;
}

export function HabitCard({ todayQuest, index = 0 }: HabitCardProps) {
  const { quest: rawQuest, completed, skipped, trackMode, targetCount, progress } =
    todayQuest;
  const { locale } = useLanguage();
  const quest = localizeQuest(rawQuest, locale);
  const { t, dict } = useT();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const encouragements = [...dict.questCard.encouragements];
  const encouragement = useMemo(
    () => pickStable(quest.id, encouragements),
    [quest.id, encouragements],
  );

  const unitLabel = rawQuest.unit ? t(`habit.units.${rawQuest.unit}`) : '';

  function showRewardToast(reward: CompleteQuestResult) {
    const extras: string[] = [];
    if (reward.statLevelUps.length) {
      const names = reward.statLevelUps
        .map((k: StatKey) => localizeStatName(k, locale))
        .join(', ');
      extras.push(t('questCard.leveledUp', { names }));
    }
    if (reward.leveledUp) {
      toast({
        variant: 'levelup',
        title: t('questCard.levelUpTitle', { level: reward.newLevel }),
        message: [
          t('questCard.xpEarnedTitle', { xp: reward.xpAwarded }),
          ...extras,
        ].join(' '),
      });
    } else {
      toast({
        variant: 'success',
        title: t('questCard.xpEarned', { xp: reward.xpAwarded }),
        message: extras.length ? extras.join(' ') : encouragement,
      });
    }
    if (reward.unlockedNodeTitles.length) {
      toast({
        variant: 'info',
        title:
          reward.unlockedNodeTitles.length > 1
            ? t('questCard.skillsUnlocked')
            : t('questCard.skillUnlocked'),
        message: reward.unlockedNodeTitles.join(', '),
      });
    }
  }

  async function handleCompleteBinary() {
    if (busy || completed) return;
    setBusy(true);
    try {
      showRewardToast(await completeHabit(quest.id));
    } catch (err) {
      toast({
        variant: 'warning',
        title: t('questCard.completeFailed'),
        message: err instanceof Error ? err.message : t('questCard.tryAgain'),
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleIncrement() {
    if (busy || completed) return;
    setBusy(true);
    try {
      const res = await incrementHabit(quest.id);
      if (res.completed && res.reward) showRewardToast(res.reward);
    } catch (err) {
      toast({
        variant: 'warning',
        title: t('questCard.completeFailed'),
        message: err instanceof Error ? err.message : t('questCard.tryAgain'),
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDecrement() {
    if (busy || completed) return;
    setBusy(true);
    try {
      await decrementHabit(quest.id);
    } catch (err) {
      toast({
        variant: 'warning',
        title: t('habit.undoFailed'),
        message: err instanceof Error ? err.message : t('questCard.tryAgain'),
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleSkip() {
    if (busy) return;
    setBusy(true);
    try {
      await skipQuest(quest.id);
      toast({
        variant: 'info',
        title: t('questCard.skipToastTitle'),
        message: t('questCard.skipToastMessage'),
      });
    } catch (err) {
      toast({
        variant: 'warning',
        title: t('questCard.skipFailed'),
        message: err instanceof Error ? err.message : t('questCard.tryAgain'),
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleUndo() {
    if (busy) return;
    setBusy(true);
    try {
      await uncompleteToday(quest.id);
    } catch (err) {
      toast({
        variant: 'warning',
        title: t('questCard.undoFailed'),
        message: err instanceof Error ? err.message : t('questCard.tryAgain'),
      });
    } finally {
      setBusy(false);
    }
  }

  const pct =
    trackMode === 'counter' && targetCount > 0
      ? Math.min(100, Math.round((progress / targetCount) * 100))
      : completed
        ? 100
        : 0;

  const xpPreview = questXP(rawQuest, 'normal');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), type: 'spring', stiffness: 220, damping: 26 }}
      className={`card p-4 ${completed ? 'opacity-90' : ''}`}
      id={`habit-${quest.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`truncate font-semibold ${completed ? 'line-through text-secondary' : ''}`}
            >
              {quest.title}
            </h3>
            {rawQuest.category === 'main' && (
              <span className="badge-brutal bg-primary text-[var(--color-on-primary)] text-[10px]">
                {t('questCategory.main')}
              </span>
            )}
          </div>
          {quest.description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted">{quest.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {rawQuest.statTargets.map((st) => (
            <span
              key={st.stat}
              className="grid h-8 w-8 place-items-center border-2 border-[var(--brutal-ink)] shadow-[2px_2px_0_0_var(--brutal-shadow-color)]"
              style={{
                borderRadius: 'var(--radius-brutal)',
                backgroundColor: STAT_BY_KEY[st.stat].color,
              }}
              title={localizeStatName(st.stat, locale)}
            >
              <StatIcon stat={st.stat} size={15} onFill />
            </span>
          ))}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <DifficultyBadge difficulty={quest.difficulty} />
        <span className="font-medium">
          +{xpPreview} {t('common.xp')}
        </span>
      </div>

      {trackMode === 'counter' && !skipped && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span>
              {translateProgress(t, progress, targetCount, unitLabel)}
            </span>
            <span className="tabular-nums text-secondary">{pct}%</span>
          </div>
          <div className="progress-brutal mt-1.5 h-2.5">
            <div
              className="h-full bg-success transition-all duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {skipped ? (
          <>
            <span className="text-sm font-semibold text-secondary">
              {t('questCard.skippedToday')}
            </span>
            <button
              type="button"
              onClick={handleUndo}
              disabled={busy}
              className="btn-brutal btn-brutal-ghost px-3 py-2 text-xs disabled:opacity-60"
            >
              <RotateCcw size={14} />
              {t('common.undo')}
            </button>
          </>
        ) : completed ? (
          <>
            <span className="badge-brutal bg-success text-[var(--color-on-vivid)]">
              <Check size={14} strokeWidth={2.5} />
              {t('habit.completedToday')}
            </span>
            {todayQuest.completion && (
              <span className="text-xs font-bold text-success">
                +{todayQuest.completion.xpAwarded} {t('common.xp')}
              </span>
            )}
            <button
              type="button"
              onClick={handleUndo}
              disabled={busy}
              className="btn-brutal btn-brutal-ghost ml-auto px-3 py-2 text-xs disabled:opacity-60"
            >
              <RotateCcw size={14} />
              {t('common.undo')}
            </button>
          </>
        ) : trackMode === 'counter' ? (
          <>
            <button
              type="button"
              onClick={handleDecrement}
              disabled={busy || progress <= 0}
              className="btn-brutal btn-brutal-ghost px-3 py-2.5 text-sm disabled:opacity-40"
              aria-label={t('habit.removeOne')}
            >
              <Minus size={16} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={handleIncrement}
              disabled={busy}
              className="btn-brutal btn-brutal-primary flex-1 px-4 py-2.5 text-sm sm:flex-none"
            >
              <Plus size={16} strokeWidth={2.5} />
              {t('habit.addOne')}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={busy}
              className="btn-brutal btn-brutal-ghost px-3 py-2 text-xs disabled:opacity-60"
            >
              <SkipForward size={14} />
              {t('common.skip')}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleCompleteBinary}
              disabled={busy}
              className="btn-brutal btn-brutal-primary flex-1 px-4 py-2.5 text-sm sm:flex-none"
            >
              <Check size={16} strokeWidth={2.5} />
              {t('habit.markDone')}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={busy}
              className="btn-brutal btn-brutal-ghost px-3 py-2 text-xs disabled:opacity-60"
            >
              <SkipForward size={14} />
              {t('common.skip')}
            </button>
          </>
        )}

        <Link
          to={`/focus/${quest.id}`}
          className="btn-brutal btn-brutal-ghost px-3 py-2 text-xs"
        >
          <Timer size={14} />
          {t('common.focus')}
        </Link>
      </div>
    </motion.div>
  );
}

function translateProgress(
  t: ReturnType<typeof useT>['t'],
  current: number,
  target: number,
  unit: string,
): string {
  if (unit) {
    return t('habit.progressWithUnit', { current, target, unit });
  }
  return t('habit.progress', { current, target });
}

export default HabitCard;
