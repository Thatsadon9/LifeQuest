/**
 * Mira "thinking" indicator — assistant-style bubble with animated dots.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { useT } from '../hooks';
import { NpcIdleSprite } from './NpcIdleSprite';

function ThinkingDots() {
  const reduce = useReducedMotion();
  if (reduce) {
    return <span className="text-primary-soft">…</span>;
  }

  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-primary"
          animate={{ y: [0, -4, 0], opacity: [0.45, 1, 0.45] }}
          transition={{
            duration: 0.75,
            repeat: Infinity,
            delay: i * 0.14,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  );
}

export function MiraThinkingBubble() {
  const { t } = useT();
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="flex justify-start"
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <div className="flex max-w-[88%] items-end gap-2">
        <NpcIdleSprite paused size="sm" label={t('today.npc.alt')} className="shrink-0" />
        <div className="rounded-xl border-2 border-[var(--brutal-ink)] bg-surface-2 px-3 py-2.5 text-sm font-medium shadow-[2px_2px_0_0_var(--brutal-shadow-color)]">
          <div className="flex items-center gap-2">
            <span className="text-secondary">{t('mira.thinking')}</span>
            <ThinkingDots />
          </div>
          <motion.div
            className="mt-2 h-1 overflow-hidden rounded-full bg-surface"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="h-full w-1/3 rounded-full bg-primary"
              animate={reduce ? undefined : { x: ['-100%', '320%'] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default MiraThinkingBubble;
