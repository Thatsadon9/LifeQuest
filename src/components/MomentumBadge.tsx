/**
 * Momentum pill — bold border + vivid fill.
 */
import { Flame, Snowflake, Sparkles, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useT } from '../hooks';
import type { MomentumInfo, MomentumStatus } from '../types';

const STATUS_STYLE: Record<
  MomentumStatus,
  { color: string; bg: string; Icon: LucideIcon }
> = {
  Cold: { color: '#38bdf8', bg: '#bae6fd', Icon: Snowflake },
  'Warming Up': { color: '#facc15', bg: '#fef08a', Icon: Sparkles },
  Flowing: { color: '#4ade80', bg: '#bbf7d0', Icon: Zap },
  'On Fire': { color: '#fb923c', bg: '#fed7aa', Icon: Flame },
};

export interface MomentumBadgeProps {
  momentum: MomentumInfo;
  hideScore?: boolean;
  className?: string;
}

export function MomentumBadge({
  momentum,
  hideScore,
  className,
}: MomentumBadgeProps) {
  const { t } = useT();
  const { color, bg, Icon } = STATUS_STYLE[momentum.status];
  return (
    <span
      className={`badge-brutal badge-vivid gap-1.5 px-3 py-1 text-sm ${className ?? ''}`}
      style={{ backgroundColor: bg }}
    >
      <Icon size={15} strokeWidth={2.5} style={{ color }} />
      <span>{t(`momentum.${momentum.status}`)}</span>
      {!hideScore && (
        <span className="opacity-70">· {momentum.score}</span>
      )}
    </span>
  );
}

export default MomentumBadge;
