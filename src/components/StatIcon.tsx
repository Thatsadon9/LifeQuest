/**
 * Renders the lucide icon for a stat, tinted with that stat's colour token.
 */
import { STAT_BY_KEY } from '../data/stats';
import { getIcon } from '../lib/icons';
import type { StatKey } from '../types';

export interface StatIconProps {
  stat: StatKey;
  /** Pixel size of the icon. */
  size?: number;
  className?: string;
  /** Apply the stat colour (default true); set false to inherit currentColor. */
  withColor?: boolean;
  /** Dark ink for icons sitting on a solid stat-colour fill. */
  onFill?: boolean;
}

export function StatIcon({
  stat,
  size = 18,
  className,
  withColor = true,
  onFill = false,
}: StatIconProps) {
  const def = STAT_BY_KEY[stat];
  const Icon = getIcon(def.icon);
  const style =
    onFill
      ? { color: 'var(--color-on-vivid)' }
      : withColor
        ? { color: def.color }
        : undefined;
  return (
    <Icon
      size={size}
      strokeWidth={2.5}
      className={className}
      style={style}
      aria-hidden
    />
  );
}

export default StatIcon;
