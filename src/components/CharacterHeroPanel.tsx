/**
 * Full character identity header — hero portrait + complete profile stats.
 * Mobile-first: compact horizontal hero row (like Today), details stacked below.
 */
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Battery,
  Crown,
  Sparkles,
  Swords,
  Trophy,
} from 'lucide-react';
import { localizeWeekday } from '../i18n/localize';
import { todayKey } from '../lib/date';
import {
  useEnergy,
  useLanguage,
  useLocalizedLevel,
  useMomentum,
  useProfile,
  useT,
  useTodayCompletions,
} from '../hooks';
import { STAT_BY_KEY } from '../data/stats';
import type { StatKey } from '../types';
import { HeroPortrait } from './HeroPortrait';
import { MomentumBadge, XPProgressBar } from './';

const LEVEL_BG = ['#fecaca', '#fed7aa', '#fef08a', '#bbf7d0', '#a7f3d0'];

export interface CharacterHeroPanelProps {
  strongestLabel: string;
  strongestKey: StatKey | null;
  completedSkills: number | null;
}

function greeting(t: ReturnType<typeof useT>['t']): string {
  const h = new Date().getHours();
  if (h < 5) return t('today.greeting.lateNight');
  if (h < 12) return t('today.greeting.morning');
  if (h < 17) return t('today.greeting.afternoon');
  if (h < 21) return t('today.greeting.evening');
  return t('today.greeting.windingDown');
}

function InfoTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="surface-2 min-w-0 rounded-xl px-2 py-2 sm:px-3 sm:py-2.5">
      <div
        className="truncate text-xs font-bold tabular-nums sm:text-sm"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
      <div className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-wide text-secondary sm:text-[10px]">
        {label}
      </div>
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: typeof Swords;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="btn-brutal btn-brutal-ghost flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-center text-[10px] font-bold leading-tight sm:flex-row sm:gap-1.5 sm:px-2.5 sm:py-2 sm:text-xs"
    >
      <Icon size={15} strokeWidth={2.5} className="shrink-0" />
      <span className="line-clamp-2 sm:line-clamp-1">{label}</span>
    </Link>
  );
}

export function CharacterHeroPanel({
  strongestLabel,
  strongestKey,
  completedSkills,
}: CharacterHeroPanelProps) {
  const profile = useProfile();
  const level = useLocalizedLevel();
  const energy = useEnergy(todayKey());
  const momentum = useMomentum();
  const todayCompletions = useTodayCompletions();
  const { t } = useT();
  const { locale } = useLanguage();
  const reduceMotion = useReducedMotion();
  const today = todayKey();

  if (!profile || !level) return null;

  const name = profile.name?.trim() || t('common.adventurer');
  const toNext = Math.max(0, level.neededForNext - level.intoLevel);
  const todayXP = todayCompletions?.reduce((sum, c) => sum + c.xpAwarded, 0) ?? 0;
  const energyValue = energy?.value;
  const strongestColor = strongestKey ? STAT_BY_KEY[strongestKey].color : undefined;

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="card overflow-hidden p-0"
      aria-label={t('character.heroPanel')}
    >
      {/* Identity row — same horizontal pattern as Today */}
      <div className="flex min-h-[9.5rem] border-b-[2.5px] border-[var(--brutal-ink)] sm:min-h-[11rem]">
        <HeroPortrait
          paused={!!reduceMotion}
          label={t('today.characterBox.heroAlt')}
          className="border-r-[2.5px]"
        />

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-3 sm:gap-2 sm:p-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-secondary sm:text-[11px]">
              {t('character.title')}
            </p>
            <h1 className="mt-0.5 truncate text-lg font-bold leading-tight sm:text-2xl">
              {name}
            </h1>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-secondary sm:text-xs">
              {greeting(t)} · {localizeWeekday(today, locale)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="badge-brutal bg-primary text-[var(--color-on-primary)]">
              {t('common.lv')} {level.level}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-soft sm:text-sm">
              <Crown size={12} strokeWidth={2.5} className="shrink-0 sm:hidden" />
              {level.rank}
            </span>
            {momentum && (
              <MomentumBadge
                momentum={momentum}
                hideScore
                className="px-2 py-0.5 text-[11px] sm:text-sm"
              />
            )}
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs sm:text-sm">
            <Battery size={14} strokeWidth={2.5} className="shrink-0 text-primary" />
            <span className="font-bold text-secondary">{t('today.characterBox.energy')}</span>
            {energyValue != null ? (
              <span
                className="badge-brutal badge-vivid text-[11px] sm:text-sm"
                style={{ backgroundColor: LEVEL_BG[energyValue - 1] }}
              >
                {t(`energy.levels.${energyValue}.label`)}
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-secondary sm:text-xs">
                {t('today.characterBox.energyPending')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* XP + summary + actions — full width, compact on mobile */}
      <div className="flex flex-col gap-3 p-3 sm:gap-4 sm:p-4">
        <div>
          <XPProgressBar
            value={level.intoLevel}
            max={level.neededForNext}
            hideValue
            label={t('character.xpToLevel', {
              xp: toNext.toLocaleString(),
              level: level.level + 1,
            })}
          />
          <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-[11px] font-bold sm:text-xs">
            <span className="text-secondary tabular-nums">
              {level.intoLevel} / {level.neededForNext} {t('common.xp')}
            </span>
            <span className="text-success tabular-nums">
              {t('today.xpToday', { xp: todayXP })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <InfoTile
            label={t('common.totalXp')}
            value={level.totalXP.toLocaleString()}
          />
          <InfoTile
            label={t('character.strongest')}
            value={strongestLabel}
            accent={strongestColor}
          />
          <InfoTile
            label={t('character.skills')}
            value={
              completedSkills == null ? t('common.emDash') : String(completedSkills)
            }
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5 border-t-[2px] border-[var(--brutal-ink)] pt-3 sm:gap-2">
          <QuickLink to="/" icon={Swords} label={t('character.beginQuest')} />
          <QuickLink to="/skills" icon={Sparkles} label={t('nav.skills')} />
          <QuickLink to="/review" icon={Trophy} label={t('nav.review')} />
        </div>
      </div>
    </motion.section>
  );
}

export default CharacterHeroPanel;
