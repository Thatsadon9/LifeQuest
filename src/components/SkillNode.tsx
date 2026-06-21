/**
 * SkillNode — one node in a skill path's vertical track.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Lock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useT } from '../hooks';
import type { SkillNode as SkillNodeType } from '../types';

export interface SkillNodeProgress {
  current: number;
  max: number;
  text: string;
}

export interface SkillNodeProps {
  node: SkillNodeType;
  pathColor: string;
  pathIcon: LucideIcon;
  requirementLabel: string;
  progress?: SkillNodeProgress;
  isFirst?: boolean;
  isLast?: boolean;
  index?: number;
}

export function SkillNode({
  node,
  pathColor,
  pathIcon: PathIcon,
  requirementLabel,
  progress,
  isFirst,
  isLast,
  index = 0,
}: SkillNodeProps) {
  const reduce = useReducedMotion();
  const { t } = useT();
  const status = node.status;
  const completed = status === 'completed';
  const unlocked = status === 'unlocked';
  const locked = status === 'locked';

  const mix = (amount: number) =>
    `color-mix(in oklab, ${pathColor} ${amount}%, transparent)`;

  const topLit = !locked;
  const bottomLit = completed;

  const pct =
    progress && progress.max > 0
      ? Math.min(100, Math.round((progress.current / progress.max) * 100))
      : 0;

  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.05, ease: 'easeOut' }}
      className={`flex gap-3 ${locked ? 'opacity-60' : ''} ${isLast ? '' : 'pb-4'}`}
    >
      <div className="relative flex w-9 shrink-0 justify-center">
        {!isFirst && (
          <span
            aria-hidden
            className="absolute left-1/2 top-0 h-5 w-0.5 -translate-x-1/2 rounded-full"
            style={{ backgroundColor: topLit ? mix(70) : 'var(--color-border)' }}
          />
        )}
        {!isLast && (
          <span
            aria-hidden
            className="absolute bottom-0 left-1/2 top-5 w-0.5 -translate-x-1/2 rounded-full"
            style={{ backgroundColor: bottomLit ? mix(70) : 'var(--color-border)' }}
          />
        )}
        <span
          className="relative z-10 mt-0.5 grid h-9 w-9 place-items-center rounded-xl"
          style={
            completed
              ? {
                  backgroundColor: pathColor,
                  color: '#0b0b12',
                  boxShadow: `0 0 18px -2px ${mix(75)}`,
                }
              : unlocked
                ? {
                    backgroundColor: mix(16),
                    border: `1.5px solid ${mix(60)}`,
                    color: pathColor,
                  }
                : {
                    backgroundColor: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-muted)',
                  }
          }
        >
          {completed ? (
            <Check size={18} strokeWidth={3} />
          ) : locked ? (
            <Lock size={15} />
          ) : (
            <PathIcon size={17} />
          )}
        </span>
      </div>

      <div className="surface-2 min-w-0 flex-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold leading-tight">{node.title}</h4>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={
              locked
                ? {
                    color: 'var(--color-muted)',
                    backgroundColor:
                      'color-mix(in oklab, var(--color-muted) 12%, transparent)',
                  }
                : { color: pathColor, backgroundColor: mix(14) }
            }
          >
            {t(`skillStatus.${status}`)}
          </span>
        </div>

        <p className="mt-1 text-xs leading-relaxed text-muted">{node.description}</p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              color: completed ? pathColor : 'var(--color-muted)',
              backgroundColor: completed
                ? mix(14)
                : 'color-mix(in oklab, var(--color-muted) 10%, transparent)',
            }}
          >
            {requirementLabel}
          </span>
        </div>

        {unlocked && progress && (
          <div className="mt-2.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-app/60">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: pathColor }}
                initial={reduce ? false : { width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.1 }}
              />
            </div>
            <div className="mt-1 text-right text-[10px] tabular-nums text-muted">
              {progress.text}
            </div>
          </div>
        )}
      </div>
    </motion.li>
  );
}

export default SkillNode;
