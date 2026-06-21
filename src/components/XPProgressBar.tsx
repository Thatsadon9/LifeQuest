/**
 * Animated XP / progress bar — Neo Brutalism chunky track.
 */
import { motion } from 'framer-motion';
import { useT } from '../hooks';

export interface XPProgressBarProps {
  value: number;
  max: number;
  label?: string;
  level?: number;
  hideValue?: boolean;
  className?: string;
}

export function XPProgressBar({
  value,
  max,
  label,
  level,
  hideValue,
  className,
}: XPProgressBarProps) {
  const { t } = useT();
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const showCaption = label !== undefined || level !== undefined;

  return (
    <div className={className}>
      {showCaption && (
        <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-1.5 font-bold">
            {level !== undefined && (
              <span className="badge-brutal bg-primary text-[var(--color-on-primary)]">
                {t('common.lv')} {level}
              </span>
            )}
            {label && <span className="text-muted">{label}</span>}
          </span>
          {!hideValue && (
            <span className="tabular-nums font-bold text-muted">
              {Math.round(value)} / {Math.round(max)} {t('common.xp')}
            </span>
          )}
        </div>
      )}
      <div className="progress-brutal">
        <motion.div
          className="progress-brutal-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
        />
      </div>
    </div>
  );
}

export default XPProgressBar;
