/**
 * ReviewCard — expandable saved weekly review summary.
 */
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useLanguage, useT } from '../hooks';
import { localizeStatName } from '../i18n/localize';
import { formatShortDateLocalized } from '../i18n/localize';
import { StatIcon } from './StatIcon';
import type { Review } from '../types';

export interface ReviewCardProps {
  review: Review;
}

function QA({ q, a }: { q: string; a: string }) {
  const { t } = useT();
  return (
    <div>
      <p className="text-xs font-semibold text-muted">{q}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-sm">{a?.trim() ? a : t('common.emDash')}</p>
    </div>
  );
}

export function ReviewCard({ review }: ReviewCardProps) {
  const [open, setOpen] = useState(false);
  const { snapshot, answers } = review;
  const rate = Math.round(snapshot.completionRate * 100);
  const { t } = useT();
  const { locale } = useLanguage();

  return (
    <div className="surface-2 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="focus-ring flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-surface"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {formatShortDateLocalized(review.weekStart, locale)} –{' '}
            {formatShortDateLocalized(review.weekEnd, locale)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="tabular-nums">
              {snapshot.totalXP} {t('common.xp')}
            </span>
            <span className="tabular-nums">{t('review.done', { rate })}</span>
            {snapshot.bestStat && (
              <span className="inline-flex items-center gap-1">
                <StatIcon stat={snapshot.bestStat} size={12} />
                {localizeStatName(snapshot.bestStat, locale)}
              </span>
            )}
          </div>
        </div>
        <motion.span
          className="shrink-0 text-muted"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t px-3.5 pb-4 pt-3">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-surface px-2 py-0.5 text-muted">
                  {t('review.completedCount', { count: snapshot.completedCount })}
                </span>
                <span className="rounded-full bg-surface px-2 py-0.5 text-muted">
                  {t('review.skippedCount', { count: snapshot.skippedCount })}
                </span>
              </div>
              <QA q={t('review.qa.wentWell')} a={answers.wentWell} />
              <QA q={t('review.qa.lostMomentum')} a={answers.lostMomentum} />
              <QA q={t('review.qa.adjust')} a={answers.adjust} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ReviewCard;
