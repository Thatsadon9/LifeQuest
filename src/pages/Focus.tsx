/**
 * Focus Mode — a distraction-free, full-screen Pomodoro for a single quest.
 *
 * Rendered OUTSIDE the app `Layout` (route `/focus/:questId`). Looks the quest
 * up via `useQuests`, runs a calm `FocusTimer`, and lets the player complete the
 * quest (tiered) straight from here — firing a celebratory toast and returning
 * to Today.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Loader2, Sparkles, Trophy } from 'lucide-react';
import { FocusTimer } from '../components/FocusTimer';
import type { FocusPhase } from '../components/FocusTimer';
import { StatIcon } from '../components';
import { FocusPageSkeleton } from '../components/skeleton';
import { useLanguage, useQuests, useToast, useT } from '../hooks';
import { completeQuest } from '../lib/actions';
import { localizeQuest } from '../i18n/localize';
import type { CompleteQuestResult, ToastInput } from '../types';

type Tier = 'minimum' | 'normal' | 'hero';

interface TierOption {
  key: Tier;
  label: string;
  blurb: string;
  field: 'minimumVersion' | 'normalVersion' | 'heroVersion';
}

const TIERS: TierOption[] = [
  { key: 'minimum', label: 'minimum', blurb: 'minimum', field: 'minimumVersion' },
  { key: 'normal', label: 'normal', blurb: 'normal', field: 'normalVersion' },
  { key: 'hero', label: 'hero', blurb: 'hero', field: 'heroVersion' },
];

/** Compose a celebratory toast from a completion result. */
function buildResultToast(
  title: string,
  res: CompleteQuestResult,
  t: ReturnType<typeof useT>['t'],
): ToastInput {
  const parts: string[] = [`+${res.xpAwarded} XP`];
  if (res.heroBonus) parts.push(t('focus.heroEffort'));
  if (res.statLevelUps.length) {
    parts.push(t('focus.leveledUp', { stats: res.statLevelUps.join(' & ') }));
  }
  if (res.unlockedNodeTitles.length) {
    parts.push(t('focus.unlocked', { titles: res.unlockedNodeTitles.join(', ') }));
  }
  return res.leveledUp
    ? {
        title: t('focus.levelReached', { level: res.newLevel }),
        message: `${title} · ${parts.join(' · ')}`,
        variant: 'levelup',
      }
    : {
        title: t('focus.questComplete', { title }),
        message: parts.join(' · '),
        variant: res.heroBonus ? 'levelup' : 'success',
      };
}

export function Focus() {
  const { questId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useT();
  const { locale } = useLanguage();

  const quests = useQuests();
  const rawQuest = questId ? quests?.find((q) => q.id === questId) : undefined;
  const quest = rawQuest ? localizeQuest(rawQuest, locale) : undefined;

  const [tier, setTier] = useState<Tier>('normal');
  const [completing, setCompleting] = useState(false);

  const exit = () => navigate('/');

  // Esc leaves Focus Mode.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhaseComplete = (finished: FocusPhase, next: FocusPhase) => {
    if (next === 'break') {
      toast({
        title: t('focus.toastBreak'),
        message: t('focus.toastBreakMessage'),
        variant: 'success',
      });
    } else {
      toast({
        title: t('focus.toastFocus'),
        message: t('focus.toastFocusMessage'),
        variant: 'info',
      });
    }
    void finished;
  };

  async function handleComplete() {
    if (!quest || completing) return;
    setCompleting(true);
    try {
      const res = await completeQuest(quest.id, tier);
      toast(buildResultToast(quest.title, res, t));
      navigate('/');
    } catch (err) {
      toast({
        title: t('focus.completeFailed'),
        message:
          err instanceof Error
            ? err.message
            : t('focus.tryAgain'),
        variant: 'warning',
      });
      setCompleting(false);
    }
  }

  // --- Loading -------------------------------------------------------------
  if (quests === undefined) {
    return <FocusPageSkeleton />;
  }

  // --- Not found -----------------------------------------------------------
  if (!quest) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 p-6 text-center pt-safe pb-safe">
        <div className="grid h-14 w-14 place-items-center border-[2.5px] border-[var(--brutal-ink)] bg-warning shadow-[3px_3px_0_0_var(--brutal-shadow-color)] text-[var(--brutal-ink)]">
          <Sparkles size={24} strokeWidth={2.5} />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight">{t('focus.notFoundTitle')}</h1>
          <p className="max-w-xs text-sm text-muted">{t('focus.notFoundMessage')}</p>
        </div>
        <button
          type="button"
          onClick={exit}
          className="btn-brutal btn-brutal-primary px-5 py-2.5 text-sm"
        >
          <ArrowLeft size={16} />
          {t('focus.backToToday')}
        </button>
      </main>
    );
  }

  const activeTier = TIERS.find((t) => t.key === tier) ?? TIERS[1];

  // --- Focus session -------------------------------------------------------
  return (
    <main className="relative flex min-h-[100dvh] flex-col px-5 pt-safe pb-safe">
      {/* Top bar: exit + quest type */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={exit}
          className="btn-brutal btn-brutal-ghost px-3 py-2 text-sm font-bold"
        >
          <ArrowLeft size={16} />
          {t('focus.exit')}
        </button>
        <span className="badge-brutal bg-surface-2 capitalize">
          {t(`questType.${quest.type}`)} · {t(`difficulty.${quest.difficulty}`)}
        </span>
      </div>

      {/* Center: quest + timer */}
      <motion.div
        className="flex flex-1 flex-col items-center justify-center py-6 text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-soft">
          {t('focus.title')}
        </p>
        <h1 className="mt-2 max-w-md text-balance text-3xl font-bold tracking-tight">
          {quest.title}
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted">{t('focus.winNext')}</p>

        {quest.statTargets.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            {quest.statTargets.map((st) => (
              <span
                key={st.stat}
                className="badge-brutal inline-flex items-center gap-1 bg-surface-2"
              >
                <StatIcon stat={st.stat} size={13} />
                {st.stat}
              </span>
            ))}
          </div>
        )}

        <FocusTimer
          className="mt-9"
          onPhaseComplete={handlePhaseComplete}
        />
      </motion.div>

      {/* Bottom: tier picker + complete */}
      <div className="mx-auto w-full max-w-md space-y-3 pb-6">
        <div className="segment-brutal grid-cols-3">
          {TIERS.map((tierOpt) => {
            const selected = tierOpt.key === tier;
            return (
              <button
                key={tierOpt.key}
                type="button"
                onClick={() => setTier(tierOpt.key)}
                aria-pressed={selected}
                data-active={selected ? 'true' : 'false'}
                className="segment-brutal-item focus-ring px-2 py-2 text-center"
              >
                <span className="block text-sm font-bold">
                  {t(
                    `completionTier.${tierOpt.key === 'minimum' ? 'partial' : tierOpt.key === 'normal' ? 'complete' : 'hero'}`,
                  )}
                </span>
                <span className="block text-[10px] font-semibold opacity-80">
                  {t(`focus.xpBlurb.${tierOpt.key}`)}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={activeTier.key}
            className="min-h-[1.25rem] text-center text-xs text-muted"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {quest[activeTier.field] || t('focus.tierFallback')}
          </motion.p>
        </AnimatePresence>

        <button
          type="button"
          onClick={handleComplete}
          disabled={completing}
          className="btn-brutal btn-brutal-success w-full py-3.5 text-base disabled:opacity-70"
        >
          {completing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {t('common.saving')}
            </>
          ) : (
            <>
              {tier === 'hero' ? <Trophy size={18} /> : <Check size={18} />}
              {t('focus.completeQuest')}
            </>
          )}
        </button>
        <p className="text-center text-[11px] text-muted">{t('focus.earlyHint')}</p>
      </div>
    </main>
  );
}

export default Focus;
