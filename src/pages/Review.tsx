/**
 * Weekly Review — metrics + reflection for the current week.
 */
import {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  CircleCheck,
  History,
  Lightbulb,
  Save,
  SkipForward,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { ReviewCard } from '../components/ReviewCard';
import { StatIcon } from '../components';
import {
  ReviewChartsSkeleton,
  ReviewPageSkeleton,
  SkeletonScreen,
} from '../components/skeleton';
import {
  useCompletions,
  useLanguage,
  useQuests,
  useReviews,
  useStats,
  useToast,
  useT,
} from '../hooks';
import { buildWeeklyReview } from '../lib/gamification';
import { saveReview } from '../lib/actions';
import { isoWeekLabel, rangeDays, weekEndKey, weekStartKey } from '../lib/date';
import {
  formatShortDateLocalized,
  localizeStatName,
  localizeWeekday,
} from '../i18n/localize';
import { STAT_KEYS, statColor } from '../data/stats';
import type { Language, Review as ReviewRecord, ReviewAnswers, ReviewSnapshot } from '../types';

const ReviewCharts = lazy(() => import('../components/ReviewCharts'));

const EMPTY_ANSWERS: ReviewAnswers = { wentWell: '', lostMomentum: '', adjust: '' };

const REFLECTION_KEYS: (keyof ReviewAnswers)[] = ['wentWell', 'lostMomentum', 'adjust'];

type TranslateFn = (path: string, params?: Record<string, string | number>) => string;

function buildInsights(
  s: ReviewSnapshot,
  locale: Language,
  tr: TranslateFn,
): string[] {
  const out: string[] = [];
  const rate = s.completionRate;
  if (s.completedCount === 0) {
    out.push(tr('review.insights.quietWeek'));
  } else if (rate >= 0.8) {
    out.push(tr('review.insights.outstanding'));
  } else if (rate >= 0.5) {
    out.push(tr('review.insights.solid'));
  } else {
    out.push(tr('review.insights.everyCounts'));
  }

  if (s.bestStat) {
    out.push(
      tr('review.insights.bestStatLed', {
        name: localizeStatName(s.bestStat, locale),
      }),
    );
  }
  if (s.neglectedStat && s.neglectedStat !== s.bestStat) {
    out.push(
      tr('review.insights.neglectedStat', {
        name: localizeStatName(s.neglectedStat, locale),
      }),
    );
  }
  if (s.mostProductiveDay) {
    out.push(
      tr('review.insights.strongestDay', {
        day: localizeWeekday(s.mostProductiveDay, locale),
      }),
    );
  }
  return out;
}

function MetricTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="surface-2 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 text-base font-bold">{value}</div>
    </div>
  );
}

export function Review() {
  const weekStart = weekStartKey();
  const weekEnd = weekEndKey();

  const completions = useCompletions({ start: weekStart, end: weekEnd });
  const quests = useQuests();
  const stats = useStats();
  const reviews = useReviews();
  const { toast } = useToast();
  const { t } = useT();
  const { locale } = useLanguage();

  const [answers, setAnswers] = useState<ReviewAnswers>(EMPTY_ANSWERS);
  const [saving, setSaving] = useState(false);
  const prefilledFor = useRef<string | null>(null);

  const loading =
    completions === undefined ||
    quests === undefined ||
    stats === undefined ||
    reviews === undefined;

  const snapshot = useMemo<ReviewSnapshot | null>(() => {
    if (!completions || !quests || !stats) return null;
    return buildWeeklyReview(weekStart, { completions, quests, stats });
  }, [completions, quests, stats, weekStart]);

  const days = useMemo(() => {
    if (!completions) return [];
    return rangeDays(weekStart, weekEnd).map((d) => {
      const xp = completions
        .filter((c) => c.date === d && c.completionType !== 'skip')
        .reduce((sum, c) => sum + (c.xpAwarded || 0), 0);
      return {
        label: localizeWeekday(d, locale, true),
        xp,
        best: d === snapshot?.mostProductiveDay,
      };
    });
  }, [completions, weekStart, weekEnd, snapshot, locale]);

  const statData = useMemo(() => {
    if (!snapshot) return [];
    return STAT_KEYS.map((k) => ({
      key: k,
      name: localizeStatName(k, locale),
      xp: snapshot.statXP[k] ?? 0,
      color: statColor(k),
    }))
      .filter((d) => d.xp > 0)
      .sort((a, b) => b.xp - a.xp);
  }, [snapshot, locale]);

  const history = useMemo(() => {
    if (!reviews) return [];
    const seen = new Set<string>();
    const out: ReviewRecord[] = [];
    for (const r of reviews) {
      if (seen.has(r.weekStart)) continue;
      seen.add(r.weekStart);
      out.push(r);
    }
    return out;
  }, [reviews]);

  const existing = useMemo(
    () => reviews?.find((r) => r.weekStart === weekStart) ?? null,
    [reviews, weekStart],
  );

  useEffect(() => {
    if (existing && prefilledFor.current !== existing.id) {
      setAnswers(existing.answers);
      prefilledFor.current = existing.id;
    }
  }, [existing]);

  const insights = snapshot ? buildInsights(snapshot, locale, t) : [];

  async function onSave() {
    if (!snapshot) return;
    setSaving(true);
    try {
      await saveReview({ weekStart, weekEnd, snapshot, answers });
      toast({
        title: existing ? t('review.updated') : t('review.saved'),
        message: t('review.savedMessage'),
        variant: 'success',
      });
    } catch {
      toast({
        title: t('review.saveFailed'),
        message: t('review.tryAgain'),
        variant: 'danger',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SkeletonScreen label={t('common.loading')}>
        <ReviewPageSkeleton />
      </SkeletonScreen>
    );
  }

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{t('review.title')}</h1>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">
            {isoWeekLabel()}
          </span>
        </div>
        <p className="text-sm text-muted">
          {t('review.subtitle', {
            start: formatShortDateLocalized(weekStart, locale),
            end: formatShortDateLocalized(weekEnd, locale),
          })}
        </p>
      </header>

      {snapshot && (
        <motion.div
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <MetricTile
            icon={<Zap size={13} className="text-hero" />}
            label={t('review.totalXp')}
            value={<span className="tabular-nums">{snapshot.totalXP}</span>}
          />
          <MetricTile
            icon={<Target size={13} className="text-primary-soft" />}
            label={t('review.completion')}
            value={
              <span className="tabular-nums">{Math.round(snapshot.completionRate * 100)}%</span>
            }
          />
          <MetricTile
            icon={<CircleCheck size={13} className="text-success" />}
            label={t('review.completed')}
            value={<span className="tabular-nums">{snapshot.completedCount}</span>}
          />
          <MetricTile
            icon={<SkipForward size={13} className="text-muted" />}
            label={t('review.skipped')}
            value={<span className="tabular-nums">{snapshot.skippedCount}</span>}
          />
          <MetricTile
            icon={<TrendingUp size={13} className="text-success" />}
            label={t('review.bestStat')}
            value={
              snapshot.bestStat ? (
                <span className="inline-flex items-center gap-1.5">
                  <StatIcon stat={snapshot.bestStat} size={16} />
                  <span className="truncate">{localizeStatName(snapshot.bestStat, locale)}</span>
                </span>
              ) : (
                <span className="text-muted">{t('common.emDash')}</span>
              )
            }
          />
          <MetricTile
            icon={<Sparkles size={13} className="text-primary-soft" />}
            label={t('review.needsLove')}
            value={
              snapshot.neglectedStat ? (
                <span className="inline-flex items-center gap-1.5">
                  <StatIcon stat={snapshot.neglectedStat} size={16} />
                  <span className="truncate">
                    {localizeStatName(snapshot.neglectedStat, locale)}
                  </span>
                </span>
              ) : (
                <span className="text-muted">{t('common.emDash')}</span>
              )
            }
          />
          <MetricTile
            icon={<CalendarDays size={13} className="text-primary-soft" />}
            label={t('review.powerDay')}
            value={
              snapshot.mostProductiveDay ? (
                <span>{localizeWeekday(snapshot.mostProductiveDay, locale, true)}</span>
              ) : (
                <span className="text-muted">{t('common.emDash')}</span>
              )
            }
          />
        </motion.div>
      )}

      {snapshot && insights.length > 0 && (
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb size={16} className="text-hero" />
            <h2 className="text-sm font-semibold">{t('review.nutshell')}</h2>
          </div>
          <ul className="space-y-2">
            {insights.map((text, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-soft"
                  aria-hidden
                />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {snapshot && (
        <div className="card p-5">
          <Suspense fallback={<ReviewChartsSkeleton />}>
            <ReviewCharts days={days} stats={statData} />
          </Suspense>
        </div>
      )}

      <div className="card space-y-4 p-5">
        <div>
          <h2 className="text-base font-semibold">{t('review.reflect')}</h2>
          <p className="text-sm text-muted">{t('review.reflectHint')}</p>
        </div>
        {REFLECTION_KEYS.map((key) => (
          <div key={key}>
            <label htmlFor={`review-${key}`} className="mb-1.5 block text-sm font-medium">
              {t(`review.fields.${key}.label`)}
            </label>
            <textarea
              id={`review-${key}`}
              value={answers[key]}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [key]: e.target.value }))}
              rows={3}
              placeholder={t(`review.fields.${key}.placeholder`)}
              className="focus-ring w-full resize-y rounded-xl border bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-muted/70"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={saving || !snapshot}
          className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <Save size={16} />
          {existing ? t('review.updateReview') : t('review.saveReview')}
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <History size={16} className="text-muted" />
          <h2 className="text-base font-semibold">{t('review.pastReviews')}</h2>
        </div>
        {history.length > 0 ? (
          <div className="space-y-2">
            {history.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        ) : (
          <p className="card p-5 text-sm text-muted">{t('review.noHistory')}</p>
        )}
      </div>
    </section>
  );
}

export default Review;
