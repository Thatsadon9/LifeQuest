/**
 * Energy check-in — chunky 1–5 brutal buttons.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { BatteryCharging } from 'lucide-react';
import { useEnergy, useT } from '../hooks';
import { setEnergy } from '../lib/actions';
import { todayKey } from '../lib/date';

const LEVEL_BG = ['#fecaca', '#fed7aa', '#fef08a', '#bbf7d0', '#a7f3d0'];

export interface EnergyCheckInProps {
  date?: string;
}

export function EnergyCheckIn({ date }: EnergyCheckInProps) {
  const day = date ?? todayKey();
  const energy = useEnergy(day);
  const [busy, setBusy] = useState(false);
  const { t } = useT();

  const current = energy?.value;
  const activeLevel = current !== undefined ? current : null;

  async function pick(value: number) {
    if (busy) return;
    setBusy(true);
    try {
      await setEnergy(day, value);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-sm font-bold">
            <BatteryCharging size={16} strokeWidth={2.5} className="text-primary" />
            {t('energy.title')}
          </h2>
          <p className="mt-0.5 text-xs font-medium text-secondary">
            {activeLevel != null
              ? t(`energy.levels.${activeLevel}.caption`)
              : t('energy.prompt')}
          </p>
        </div>
        {activeLevel != null && (
          <span
            className="badge-brutal badge-vivid shrink-0"
            style={{
              backgroundColor: LEVEL_BG[activeLevel - 1],
            }}
          >
            {t(`energy.levels.${activeLevel}.label`)}
          </span>
        )}
      </div>

      <div
        className="mt-3 grid grid-cols-5 gap-2"
        role="group"
        aria-label={t('energy.levelLabel')}
      >
        {[1, 2, 3, 4, 5].map((value) => {
          const exact = value === current;
          const filled = current !== undefined && value <= current;
          return (
            <motion.button
              key={value}
              type="button"
              whileTap={{ scale: 0.92, translateY: 1 }}
              disabled={busy}
              onClick={() => pick(value)}
              aria-pressed={exact}
              aria-label={t(`energy.levels.${value}.label`)}
              className="focus-ring py-2.5 text-sm font-bold tabular-nums disabled:opacity-60"
              style={{
                borderRadius: 'var(--radius-brutal)',
                border: '2.5px solid var(--brutal-ink)',
                color: filled ? 'var(--color-on-vivid)' : 'var(--color-text)',
                backgroundColor: filled ? LEVEL_BG[value - 1] : 'var(--color-surface-2)',
                boxShadow: exact
                  ? '3px 3px 0 0 var(--brutal-shadow-color)'
                  : filled
                    ? '2px 2px 0 0 var(--brutal-shadow-color)'
                    : '1px 1px 0 0 var(--brutal-shadow-color)',
                transform: exact ? 'translate(-1px, -1px)' : undefined,
              }}
            >
              {value}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-1.5 flex justify-between px-0.5 text-[10px] font-bold uppercase tracking-wide text-secondary">
        <span>{t('energy.drained')}</span>
        <span>{t('energy.energised')}</span>
      </div>
    </div>
  );
}

export default EnergyCheckIn;
