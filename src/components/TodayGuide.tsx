/**
 * Dismissible welcome card — explains what LifeQuest is and the daily loop.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, X } from 'lucide-react';
import { useT } from '../hooks';
import { getUserItem, setUserItem } from '../lib/auth/userStorage';

const STORAGE_KEY = 'lifequest-guide-dismissed';

export function TodayGuide() {
  const { t } = useT();
  const [visible, setVisible] = useState(() => getUserItem(STORAGE_KEY) !== '1');

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    setUserItem(STORAGE_KEY, '1');
  }

  const steps = [
    t('today.guide.step1'),
    t('today.guide.step2'),
    t('today.guide.step3'),
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card relative overflow-hidden p-4"
      style={{ backgroundColor: 'var(--color-surface-2)' }}
    >
      <button
        type="button"
        onClick={dismiss}
        className="icon-btn-brutal absolute right-3 top-3"
        aria-label={t('today.guide.dismiss')}
      >
        <X size={16} strokeWidth={2.5} />
      </button>

      <div className="flex gap-3 pr-10">
        <span className="grid h-11 w-11 shrink-0 place-items-center brutal-header shadow-[2px_2px_0_0_var(--brutal-shadow-color)]">
          <Sparkles size={20} strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight">{t('today.guide.title')}</h2>
          <p className="mt-1 text-sm font-medium text-secondary">{t('today.guide.subtitle')}</p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <span className="badge-brutal shrink-0 bg-primary text-[var(--color-on-primary)]">
              {i + 1}
            </span>
            <span className="pt-0.5 font-medium">{step}</span>
          </li>
        ))}
      </ul>

      <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary-soft">
        <BookOpen size={14} strokeWidth={2.5} />
        {t('today.guide.benefit')}
      </p>
    </motion.section>
  );
}

export default TodayGuide;
