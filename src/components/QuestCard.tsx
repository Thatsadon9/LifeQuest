/**
 * QuestCard — a single quest on the Today board.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, RotateCcw, SkipForward, Star, Timer } from 'lucide-react';
import { completeQuest, skipQuest, uncompleteToday } from '../lib/actions';
import { questXP } from '../lib/gamification';
import { localizeQuest, localizeStatName } from '../i18n/localize';
import { useLanguage, useT, useToast } from '../hooks';
import { STAT_BY_KEY } from '../data/stats';
import { StatIcon } from './StatIcon';
import { DifficultyBadge } from './questMeta';
import type { CompletionType, StatKey, TodayQuest } from '../types';

type Tier = Exclude<CompletionType, 'skip'>;

function pickStable(id: string, list: string[]): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return list[Math.abs(h) % list.length];
}

export interface QuestCardProps {
  todayQuest: TodayQuest;
  index?: number;
}

export function QuestCard({ todayQuest, index = 0 }: QuestCardProps) {
  const { quest: rawQuest, completion, completed, skipped } = todayQuest;
  const { locale } = useLanguage();
  const quest = localizeQuest(rawQuest, locale);
  const { t, dict } = useT();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const acted = completed || skipped;

  const TIERS: { type: Tier; label: string }[] = [
    { type: 'minimum', label: t('completionTier.partial') },
    { type: 'normal', label: t('completionTier.complete') },
    { type: 'hero', label: t('completionTier.hero') },
  ];

  const tierLabel = (type: Tier) => t(`completionTier.${type === 'minimum' ? 'partial' : type === 'normal' ? 'complete' : 'hero'}`);

  const encouragements = [...dict.questCard.encouragements];
  const encouragement = useMemo(
    () => pickStable(quest.id, encouragements),
    [quest.id, encouragements],
  );

  async function handleComplete(type: Tier) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await completeQuest(quest.id, type);
      const extras: string[] = [];
      if (res.heroBonus) extras.push(t('questCard.heroUnlocked'));
      if (res.statLevelUps.length) {
        const names = res.statLevelUps
          .map((k: StatKey) => localizeStatName(k, locale))
          .join(', ');
        extras.push(t('questCard.leveledUp', { names }));
      }

      if (res.leveledUp) {
        toast({
          variant: 'levelup',
          title: t('questCard.levelUpTitle', { level: res.newLevel }),
          message: [t('questCard.xpEarnedTitle', { xp: res.xpAwarded }), ...extras].join(' '),
        });
      } else {
        toast({
          variant: 'success',
          title: t('questCard.xpEarned', { xp: res.xpAwarded }),
          message: extras.length ? extras.join(' ') : encouragement,
        });
      }

      if (res.unlockedNodeTitles.length) {
        toast({
          variant: 'info',
          title:
            res.unlockedNodeTitles.length > 1
              ? t('questCard.skillsUnlocked')
              : t('questCard.skillUnlocked'),
          message: res.unlockedNodeTitles.join(', '),
        });
      }
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

  const focusLink = (
    <Link
      to={`/focus/${quest.id}`}
      className="btn-brutal btn-brutal-ghost ml-auto px-3 py-2 text-xs"
    >
      <Timer size={14} strokeWidth={2.5} />
      {t('common.focus')}
    </Link>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), type: 'spring', stiffness: 220, damping: 26 }}
      className="card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{quest.title}</h3>
          {quest.description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted">{quest.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {quest.statTargets.map((st) => (
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
          {t('quests.upToXp', { xp: questXP(quest, 'hero') })}
        </span>
        {quest.trigger && <span className="truncate">· {quest.trigger}</span>}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {acted ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="mt-3"
          >
            <div className="surface-2 flex items-center gap-3 p-3">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                className="grid h-10 w-10 shrink-0 place-items-center border-2 border-[var(--brutal-ink)] shadow-[2px_2px_0_0_var(--brutal-shadow-color)]"
                style={{
                  borderRadius: 'var(--radius-brutal)',
                  backgroundColor: completed ? '#4ade80' : 'var(--color-surface)',
                  color: completed ? 'var(--color-on-vivid)' : 'var(--color-text)',
                }}
              >
                {completed ? <Check size={18} /> : <SkipForward size={18} />}
              </motion.span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {completed
                    ? t('questCard.completed', {
                        tier: tierLabel((completion?.completionType as Tier) ?? 'normal'),
                      })
                    : t('questCard.skippedToday')}
                </p>
                <p className="text-xs text-muted">
                  {completed
                    ? `+${completion?.xpAwarded ?? 0} ${t('common.xp')} · ${encouragement}`
                    : t('questCard.skippedRest')}
                </p>
              </div>
              <button
                type="button"
                onClick={handleUndo}
                disabled={busy}
                className="btn-brutal btn-brutal-ghost shrink-0 px-3 py-2 text-xs disabled:opacity-60"
              >
                <RotateCcw size={14} />
                {t('common.undo')}
              </button>
            </div>
            <div className="mt-2 flex">{focusLink}</div>
          </motion.div>
        ) : (
          <motion.div
            key="actions"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="mt-3"
          >
            <div className="space-y-2">
              {TIERS.map((tier) => {
                const xp = questXP(quest, tier.type);
                const text =
                  tier.type === 'minimum'
                    ? quest.minimumVersion
                    : tier.type === 'normal'
                      ? quest.normalVersion
                      : quest.heroVersion;
                const isNormal = tier.type === 'normal';
                const isHero = tier.type === 'hero';
                const tierBg = isNormal
                  ? '#c084fc'
                  : isHero
                    ? '#fb923c'
                    : 'var(--color-surface-2)';
                const tierInk =
                  isNormal || isHero ? 'var(--color-on-vivid)' : 'var(--color-text)';
                return (
                  <motion.button
                    key={tier.type}
                    type="button"
                    whileTap={{ scale: 0.97, translateY: 2 }}
                    disabled={busy}
                    onClick={() => handleComplete(tier.type)}
                    className="focus-ring flex w-full items-center justify-between gap-3 border-[2.5px] border-[var(--brutal-ink)] px-3 py-2.5 text-left shadow-[3px_3px_0_0_var(--brutal-shadow-color)] disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      borderRadius: 'var(--radius-brutal)',
                      backgroundColor: tierBg,
                      color: tierInk,
                    }}
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-bold">
                        {tier.label}
                        {isNormal && (
                          <Star size={12} strokeWidth={2.5} fill="currentColor" />
                        )}
                      </span>
                      {text && (
                        <span className="mt-0.5 block truncate text-xs font-semibold opacity-80">
                          {text}
                        </span>
                      )}
                    </span>
                    <span className="badge-brutal shrink-0 bg-[var(--color-on-vivid)] text-[var(--color-on-primary)]">
                      +{xp}
                    </span>
                  </motion.button>
                );
              })}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleSkip}
                disabled={busy}
                className="btn-brutal btn-brutal-ghost px-3 py-2 text-xs disabled:opacity-60"
              >
                <SkipForward size={14} />
                {t('common.skip')}
              </button>
              {focusLink}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default QuestCard;
