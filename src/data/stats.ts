/**
 * The seven character stats — static definitions (icon, colour, copy).
 * Colours mirror the CSS tokens in `src/styles/index.css` (e.g. `--color-int`).
 */
import type { StatDef, StatKey } from '../types';

export const STATS: StatDef[] = [
  {
    key: 'INT',
    name: 'Intellect',
    icon: 'Brain',
    colorToken: 'int',
    color: '#38bdf8',
    description: 'Knowledge from studying, reading, and learning new things.',
  },
  {
    key: 'FOCUS',
    name: 'Focus',
    icon: 'Target',
    colorToken: 'focus',
    color: '#6366f1',
    description: 'Deep work and the ability to sustain attention.',
  },
  {
    key: 'STR',
    name: 'Strength',
    icon: 'Dumbbell',
    colorToken: 'str',
    color: '#fb7185',
    description: 'Physical training, movement, and exercise.',
  },
  {
    key: 'WIS',
    name: 'Wisdom',
    icon: 'Compass',
    colorToken: 'wis',
    color: '#2dd4bf',
    description: 'Reflection, mindfulness, and sound judgment.',
  },
  {
    key: 'CHA',
    name: 'Charisma',
    icon: 'MessageCircle',
    colorToken: 'cha',
    color: '#e879f9',
    description: 'Communication, speaking, and social confidence.',
  },
  {
    key: 'CRAFT',
    name: 'Craft',
    icon: 'Hammer',
    colorToken: 'craft',
    color: '#fbbf24',
    description: 'Building, making, and creative output.',
  },
  {
    key: 'COIN',
    name: 'Coin',
    icon: 'Coins',
    colorToken: 'coin',
    color: '#34d399',
    description: 'Money discipline and financial health.',
  },
];

/** Ordered list of stat keys. */
export const STAT_KEYS: StatKey[] = STATS.map((s) => s.key);

/** Lookup map from key to definition. */
export const STAT_BY_KEY: Record<StatKey, StatDef> = STATS.reduce(
  (acc, s) => {
    acc[s.key] = s;
    return acc;
  },
  {} as Record<StatKey, StatDef>,
);

/** Convenience: the inline-style colour for a stat key. */
export function statColor(key: StatKey): string {
  return STAT_BY_KEY[key]?.color ?? '#7c3aed';
}
