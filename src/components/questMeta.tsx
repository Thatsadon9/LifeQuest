/**
 * Quest metadata badges — thick-bordered Neo Brutalism pills.
 */
import { useT } from '../hooks';
import type { Difficulty, QuestCategory, QuestType } from '../types';

export const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy: '#4ade80',
  medium: '#38bdf8',
  hard: '#facc15',
  heroic: '#c084fc',
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const { t } = useT();
  const color = DIFFICULTY_COLOR[difficulty];
  const label = t(`difficulty.${difficulty}`);
  return (
    <span
      className="badge-brutal badge-vivid"
      style={{ backgroundColor: color, color: 'var(--color-on-vivid)' }}
    >
      {label}
    </span>
  );
}

export function MetaBadge({ label }: { label: string }) {
  return (
    <span className="badge-brutal bg-surface-2 text-text">{label}</span>
  );
}

export function TypeBadge({ type }: { type: QuestType }) {
  const { t } = useT();
  return <MetaBadge label={t(`questType.${type}`)} />;
}

export function CategoryBadge({ category }: { category: QuestCategory }) {
  const { t } = useT();
  return <MetaBadge label={t(`questCategory.${category}`)} />;
}

/** Localized label helpers for quest metadata rows. */
export function useQuestMetaLabels() {
  const { t } = useT();
  return {
    difficultyLabel: (d: Difficulty) => t(`difficulty.${d}`),
    typeLabel: (type: QuestType) => t(`questType.${type}`),
    categoryLabel: (c: QuestCategory) => t(`questCategory.${c}`),
  };
}
