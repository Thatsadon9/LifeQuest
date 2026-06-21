/**
 * Today — habit-first daily board: check off habits, earn XP, optional RPG extras.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ListChecks, ScrollText, Sparkles } from 'lucide-react';
import {
  useActiveQuests,
  useLanguage,
  useMomentum,
  useT,
  useTodayCompletions,
  useTodayHabits,
} from '../hooks';
import { recoverySuggestions } from '../lib/gamification';
import { localizeQuest } from '../i18n/localize';
import { EmptyState } from '../components';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { EnergyCheckIn } from '../components/EnergyCheckIn';
import { HabitCard } from '../components/HabitCard';
import { TodayHabitSortBar } from '../components/TodayHabitSortBar';
import { TodayCharacterBox } from '../components/TodayCharacterBox';
import { NpcGuideBanner } from '../components/NpcGuideBanner';
import { TodayGuide } from '../components/TodayGuide';
import { SkeletonScreen, TodayPageSkeleton } from '../components/skeleton';
import {
  loadTodayHabitSortMode,
  saveTodayHabitSortMode,
  sortTodayHabits,
  type TodayHabitSortMode,
} from '../lib/todayHabitsSort';

export function Today() {
  const momentum = useMomentum();
  const habits = useTodayHabits();
  const todayCompletions = useTodayCompletions();
  const activeQuests = useActiveQuests();
  const { t } = useT();
  const { locale } = useLanguage();
  const [sortMode, setSortMode] = useState<TodayHabitSortMode>(loadTodayHabitSortMode);

  const sortedHabits = useMemo(
    () => (habits ? sortTodayHabits(habits, sortMode, locale) : undefined),
    [habits, sortMode, locale],
  );

  function handleSortChange(mode: TodayHabitSortMode) {
    setSortMode(mode);
    saveTodayHabitSortMode(mode);
  }

  const todayXP = todayCompletions?.reduce((sum, c) => sum + c.xpAwarded, 0) ?? 0;
  const suggestions = activeQuests ? recoverySuggestions(activeQuests) : [];
  const pendingCount = habits?.filter((h) => !h.completed && !h.skipped).length ?? 0;
  const doneCount = habits?.filter((h) => h.completed).length ?? 0;
  const totalHabits = habits?.length ?? 0;

  if (habits === undefined) {
    return (
      <SkeletonScreen label={t('common.loading')}>
        <TodayPageSkeleton />
      </SkeletonScreen>
    );
  }

  return (
    <div className="space-y-4">
      <TodayCharacterBox todayXP={todayXP} />

      <NpcGuideBanner
        pendingCount={pendingCount}
        totalHabits={totalHabits}
        todayXP={todayXP}
        recoveryMode={momentum?.recoveryMode}
      />

      <section id="today-habits" className="space-y-2.5">
        <div className="space-y-2 px-1">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center border-2 border-[var(--brutal-ink)] bg-primary text-[var(--color-on-primary)] shadow-[1px_1px_0_0_var(--brutal-shadow-color)]">
              <ListChecks size={14} strokeWidth={2.5} />
            </span>
            <h2 className="text-sm font-bold">{t('today.habits.title')}</h2>
            {habits.length > 0 && (
              <span className="ml-auto text-xs font-bold tabular-nums text-secondary">
                {doneCount}/{habits.length}
              </span>
            )}
          </div>

          {habits.length > 0 && (
            <TodayHabitSortBar value={sortMode} onChange={handleSortChange} />
          )}
        </div>

        {habits.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title={t('today.emptyTitle')}
            message={t('today.emptyMessage')}
            action={
              <Link to="/settings" className="btn-brutal btn-brutal-primary px-4 py-2 text-sm">
                {t('today.openSettings')}
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {sortedHabits!.map((hq, i) => (
              <HabitCard key={hq.quest.id} todayQuest={hq} index={i} />
            ))}
          </div>
        )}
      </section>

      <TodayGuide />

      <CollapsibleSection
        id="optional-rpg"
        title={t('today.optional.title')}
        subtitle={pendingCount > 0 ? undefined : t('today.optional.subtitleDone')}
        defaultOpen={false}
      >
        <div className="space-y-4">
          <div id="energy-checkin">
            <EnergyCheckIn />
          </div>

          {momentum?.recoveryMode && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="card card-recovery p-4"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center border-2 border-[var(--brutal-ink)] bg-primary text-[var(--color-on-primary)] shadow-[2px_2px_0_0_var(--brutal-shadow-color)]">
                  <Sparkles size={16} strokeWidth={2.5} />
                </span>
                <h2 className="text-sm font-bold">{t('today.recoveryMode')}</h2>
              </div>
              <p className="mt-1.5 text-sm font-medium text-secondary">
                {t('today.recoveryHint')}
              </p>
              <div className="mt-3 grid gap-2">
                {suggestions.slice(0, 2).map((q) => {
                  const display = localizeQuest(q, locale);
                  return (
                    <Link
                      key={q.id}
                      to={`/focus/${q.id}`}
                      className="focus-ring surface-2 flex items-center justify-between gap-3 p-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">{display.title}</span>
                        <span className="block truncate text-xs text-secondary">
                          {display.minimumVersion}
                        </span>
                      </span>
                      <span className="badge-brutal shrink-0 bg-primary text-[var(--color-on-primary)]">
                        {t('common.start')}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}

export default Today;
