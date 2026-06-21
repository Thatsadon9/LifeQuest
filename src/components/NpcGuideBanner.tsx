/**
 * Town guide NPC — idle sprite + contextual speech + Mira AI chat entry.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { useT } from '../hooks';
import { MiraChatButton } from './MiraChat';
import { NpcIdleSprite } from './NpcIdleSprite';

export interface NpcGuideBannerProps {
  pendingCount: number;
  totalHabits: number;
  todayXP: number;
  recoveryMode?: boolean;
}

function pickLine(
  t: ReturnType<typeof useT>['t'],
  { pendingCount, totalHabits, todayXP, recoveryMode }: NpcGuideBannerProps,
): string {
  if (recoveryMode) return t('today.npc.lines.recovery');
  if (totalHabits > 0 && pendingCount === 0) {
    return t('today.npc.lines.allDone', { xp: todayXP });
  }
  if (pendingCount > 0) {
    return t('today.npc.lines.habitsPending', { count: pendingCount });
  }

  const h = new Date().getHours();
  if (h < 5) return t('today.npc.lines.lateNight');
  if (h < 12) return t('today.npc.lines.morning');
  if (h < 17) return t('today.npc.lines.afternoon');
  if (h < 21) return t('today.npc.lines.evening');
  return t('today.npc.lines.night');
}

export function NpcGuideBanner(props: NpcGuideBannerProps) {
  const { t } = useT();
  const reduceMotion = useReducedMotion();
  const line = pickLine(t, props);

  return (
    <motion.section
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="card flex items-center gap-2 overflow-hidden p-3 sm:gap-3 sm:p-4"
        aria-label={t('today.npc.label')}
      >
        <NpcIdleSprite
          paused={!!reduceMotion}
          label={t('today.npc.alt')}
        />

        <div className="relative min-w-0 flex-1">
          <div
            aria-hidden
            className="absolute -left-1.5 top-1/2 hidden h-2.5 w-2.5 -translate-y-1/2 rotate-45 border-b-2 border-l-2 border-[var(--brutal-ink)] bg-surface-2 sm:block"
          />
          <div className="rounded-xl border-2 border-[var(--brutal-ink)] bg-surface-2 px-3 py-2.5 shadow-[2px_2px_0_0_var(--brutal-shadow-color)] sm:px-4 sm:py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-primary-soft">
                  {t('today.npc.role')}
                </p>
                <p className="text-sm font-bold">{t('today.npc.name')}</p>
              </div>
              <MiraChatButton />
            </div>
            <p className="mt-1 text-sm font-medium leading-snug text-secondary">{line}</p>
          </div>
        </div>
    </motion.section>
  );
}

export default NpcGuideBanner;
