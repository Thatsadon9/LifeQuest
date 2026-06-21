/**
 * StatCard — a single character stat with localized name/description.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp, Trophy } from 'lucide-react';
import { STAT_BY_KEY } from '../data/stats';
import { statLevelFromXP } from '../lib/gamification';
import { localizeStatDescription, localizeStatName } from '../i18n/localize';
import { useLanguage, useT } from '../hooks';
import type { Stat } from '../types';
import { StatIcon } from './StatIcon';
import { XPProgressBar } from './XPProgressBar';

export type StatHighlight = 'best' | 'weakest';

export interface StatCardProps {
  stat: Stat;
  highlight?: StatHighlight;
  index?: number;
}

export function StatCard({ stat, highlight, index = 0 }: StatCardProps) {
  const reduce = useReducedMotion();
  const { locale } = useLanguage();
  const { t } = useT();
  const def = STAT_BY_KEY[stat.key];
  const color = def.color;
  const info = statLevelFromXP(stat.xp);
  const pct = Math.round(info.progress * 100);
  const isBest = highlight === 'best';
  const name = localizeStatName(stat.key, locale);
  const description = localizeStatDescription(stat.key, locale);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.05, ease: 'easeOut' }}
      className="card relative overflow-hidden p-4"
    >
      {isBest && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1.5 border-b-2 border-[var(--brutal-ink)]"
          style={{ backgroundColor: color }}
        />
      )}

      <div className="relative flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center border-2 border-[var(--brutal-ink)] shadow-[2px_2px_0_0_var(--brutal-shadow-color)]"
            style={{
              borderRadius: 'var(--radius-brutal)',
              backgroundColor: color,
            }}
          >
            <StatIcon stat={stat.key} size={22} onFill />
          </span>
          <div className="min-w-0">
            <div className="truncate font-semibold leading-tight">{name}</div>
            <div className="text-xs text-muted">
              {t('common.lv')} {info.level} · {stat.xp.toLocaleString()} {t('common.xp')}
            </div>
          </div>
        </div>

        {highlight && (
          <span
            className="badge-brutal shrink-0 gap-1 uppercase"
            style={
              isBest
                ? { backgroundColor: color, color: 'var(--color-on-vivid)' }
                : { backgroundColor: '#fef08a', color: 'var(--color-on-vivid)' }
            }
          >
            {isBest ? <Trophy size={11} /> : <TrendingUp size={11} />}
            {isBest ? t('character.strongest') : t('character.trainNext')}
          </span>
        )}
      </div>

      <p className="relative mt-2.5 text-xs leading-relaxed text-muted">{description}</p>

      <div className="relative mt-3">
        <XPProgressBar value={info.intoLevel} max={info.neededForNext} />
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted">
          <span className="tabular-nums">
            {info.intoLevel} / {info.neededForNext} {t('common.xp')}
          </span>
          <span className="tabular-nums">
            {pct}% → {t('common.lv')} {info.level + 1}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default StatCard;
