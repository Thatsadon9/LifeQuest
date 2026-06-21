/**
 * Barrel for the shared, cross-cutting components owned by the foundation.
 * Feature pages should import these rather than re-implementing them.
 */
export { Layout } from './Layout';
export { Sidebar } from './Sidebar';
export { BottomNav } from './BottomNav';
export { OfflineBanner } from './OfflineBanner';
export { ToastNotification } from './ToastNotification';
export { XPProgressBar } from './XPProgressBar';
export type { XPProgressBarProps } from './XPProgressBar';
export { MomentumBadge } from './MomentumBadge';
export type { MomentumBadgeProps } from './MomentumBadge';
export { StatIcon } from './StatIcon';
export type { StatIconProps } from './StatIcon';
export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';
export { ConfirmDialog } from './ConfirmDialog';
export type { ConfirmDialogProps } from './ConfirmDialog';
export { NAV_ITEMS } from './nav';
export type { NavItem } from './nav';

/* ----------------------------------------------------------------------------
 * Feature components. These can also be imported by direct path (both styles
 * coexist); barrelling them here keeps imports consistent. `ReviewCharts` is
 * intentionally omitted — it is only ever loaded via `React.lazy(() =>
 * import('./ReviewCharts'))`, and re-exporting it here could pull Recharts into
 * the main chunk and defeat that code-split.
 * ------------------------------------------------------------------------- */
export { QuestCard } from './QuestCard';
export type { QuestCardProps } from './QuestCard';
export { QuestFormModal } from './QuestFormModal';
export type { QuestFormModalProps } from './QuestFormModal';
export { QuestListItem } from './QuestListItem';
export type { QuestListItemProps } from './QuestListItem';
export { EnergyCheckIn } from './EnergyCheckIn';
export type { EnergyCheckInProps } from './EnergyCheckIn';
export {
  DifficultyBadge,
  MetaBadge,
  useQuestMetaLabels,
  DIFFICULTY_COLOR,
} from './questMeta';
export { StatCard } from './StatCard';
export type { StatCardProps, StatHighlight } from './StatCard';
export { HeroPortrait } from './HeroPortrait';
export type { HeroPortraitProps } from './HeroPortrait';
export { NpcIdleSprite } from './NpcIdleSprite';
export type { NpcIdleSpriteProps } from './NpcIdleSprite';
export { NpcGuideBanner } from './NpcGuideBanner';
export type { NpcGuideBannerProps } from './NpcGuideBanner';
export { MiraChat, MiraChatButton } from './MiraChat';
export type { MiraChatProps, MiraChatButtonProps } from './MiraChat';
export {
  SkeletonScreen,
  Sk,
  SkCard,
  SkLines,
  SkList,
  SkPageHeader,
  SkSettingCard,
  TodayPageSkeleton,
  QuestsPageSkeleton,
  CharacterPageSkeleton,
  SkillTreePageSkeleton,
  ReviewPageSkeleton,
  SettingsPageSkeleton,
  MiraPageSkeleton,
  FocusPageSkeleton,
  ReviewChartsSkeleton,
  HabitListSkeleton,
  QuestListSkeleton,
} from './skeleton';
export { CharacterHeroPanel } from './CharacterHeroPanel';
export type { CharacterHeroPanelProps } from './CharacterHeroPanel';
export { StatSpiderChart } from './StatSpiderChart';
export type { StatSpiderChartProps } from './StatSpiderChart';
export { SkillNode } from './SkillNode';
export type { SkillNodeProps, SkillNodeProgress } from './SkillNode';
export { ReviewCard } from './ReviewCard';
export type { ReviewCardProps } from './ReviewCard';
export { FocusTimer } from './FocusTimer';
export type { FocusTimerProps, FocusPhase } from './FocusTimer';
