/**
 * Sort dropdown for today's habit list.
 */
import { ArrowDownAZ, ChevronDown, Layers, Sparkles, Star, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useT } from '../hooks';
import {
  TODAY_HABIT_SORT_MODES,
  type TodayHabitSortMode,
} from '../lib/todayHabitsSort';

const MODE_ICONS: Record<TodayHabitSortMode, LucideIcon> = {
  default: Layers,
  difficulty: Trophy,
  xp: Sparkles,
  name: ArrowDownAZ,
  category: Star,
};

export interface TodayHabitSortBarProps {
  value: TodayHabitSortMode;
  onChange: (mode: TodayHabitSortMode) => void;
}

export function TodayHabitSortBar({ value, onChange }: TodayHabitSortBarProps) {
  const { t } = useT();
  const ActiveIcon = MODE_ICONS[value];

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="today-habit-sort"
        className="shrink-0 text-xs font-semibold text-secondary"
      >
        {t('today.habits.sortLabel')}
      </label>
      <div className="relative min-w-0 flex-1">
        <ActiveIcon
          size={14}
          strokeWidth={2.5}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-primary-soft"
          aria-hidden
        />
        <select
          id="today-habit-sort"
          value={value}
          onChange={(e) => onChange(e.target.value as TodayHabitSortMode)}
          className="input-brutal focus-ring w-full cursor-pointer appearance-none py-2 pl-8 pr-8 text-xs font-bold"
        >
          {TODAY_HABIT_SORT_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {t(`today.habits.sort.${mode}`)}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          strokeWidth={2.5}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden
        />
      </div>
    </div>
  );
}

export default TodayHabitSortBar;
