/**
 * Hero portrait + daily stats — the player's identity at the top of Today.
 */
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Battery, ChevronRight } from 'lucide-react';
import { localizeWeekday } from '../i18n/localize';
import { todayKey } from '../lib/date';
import {
  useEnergy,
  useLanguage,
  useLocalizedLevel,
  useMomentum,
  useProfile,
  useT,
} from '../hooks';
import { HeroPortrait } from './HeroPortrait';
import { MomentumBadge, XPProgressBar } from './';
import { Sk } from './skeleton';

const LEVEL_BG = ['#fecaca', '#fed7aa', '#fef08a', '#bbf7d0', '#a7f3d0'];

export interface TodayCharacterBoxProps {
  todayXP: number;
}

function greeting(t: ReturnType<typeof useT>['t']): string {
  const h = new Date().getHours();
  if (h < 5) return t('today.greeting.lateNight');
  if (h < 12) return t('today.greeting.morning');
  if (h < 17) return t('today.greeting.afternoon');
  if (h < 21) return t('today.greeting.evening');
  return t('today.greeting.windingDown');
}

function PortraitSkeleton() {
  return (
    <Sk className="aspect-square w-[7.5rem] shrink-0 rounded-none border-0 sm:w-44 md:w-52" />
  );
}

function StatsSkeleton() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-2 p-4">
      <Sk className="h-6 w-32" />
      <Sk className="h-4 w-48" />
      <Sk className="mt-2 h-2 w-full" />
    </div>
  );
}

export function TodayCharacterBox({ todayXP }: TodayCharacterBoxProps) {
  const profile = useProfile();
  const level = useLocalizedLevel();
  const energy = useEnergy(todayKey());
  const momentum = useMomentum();
  const { t } = useT();
  const { locale } = useLanguage();
  const reduceMotion = useReducedMotion();
  const today = todayKey();

  const loading = profile === undefined || level === undefined;
  const toNext = level ? Math.max(0, level.neededForNext - level.intoLevel) : 0;
  const energyValue = energy?.value;

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden p-0"
      aria-label={t('today.characterBox.label')}
    >
      <div className="flex min-h-[11rem] sm:min-h-[13rem]">
        {loading ? (
          <PortraitSkeleton />
        ) : (
          <HeroPortrait
            paused={!!reduceMotion}
            label={t('today.characterBox.heroAlt')}
            className="border-r-[2.5px]"
          />
        )}

        {loading ? (
          <StatsSkeleton />
        ) : (
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold leading-tight sm:text-xl">
                  {profile.name}
                </h1>
                <p className="mt-0.5 text-xs font-semibold text-secondary">
                  {greeting(t)} · {localizeWeekday(today, locale)}
                </p>
              </div>
              <Link
                to="/character"
                className="focus-ring shrink-0 text-xs font-bold text-primary-soft hover:underline"
              >
                <span className="hidden sm:inline">{t('today.characterBox.viewSheet')}</span>
                <ChevronRight size={18} strokeWidth={2.5} className="sm:hidden" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-brutal bg-primary text-[var(--color-on-primary)]">
                {t('common.lv')} {level.level}
              </span>
              <span className="text-sm font-bold text-primary-soft">{level.rank}</span>
              {momentum && <MomentumBadge momentum={momentum} hideScore />}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Battery size={15} strokeWidth={2.5} className="shrink-0 text-primary" />
              <span className="font-bold text-secondary">{t('today.characterBox.energy')}</span>
              {energyValue != null ? (
                <span
                  className="badge-brutal badge-vivid"
                  style={{ backgroundColor: LEVEL_BG[energyValue - 1] }}
                >
                  {t(`energy.levels.${energyValue}.label`)}
                </span>
              ) : (
                <span className="text-xs font-semibold text-secondary">
                  {t('today.characterBox.energyPending')}
                </span>
              )}
            </div>

            <XPProgressBar
              value={level.intoLevel}
              max={level.neededForNext}
              hideValue
              label={t('today.xpToNext', { xp: toNext, level: level.level + 1 })}
            />

            <div className="flex justify-between text-xs font-bold">
              <span className="text-secondary">
                {t('today.totalXp', { xp: level.totalXP.toLocaleString() })}
              </span>
              <span className="text-success">{t('today.xpToday', { xp: todayXP })}</span>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

export default TodayCharacterBox;
