/**
 * Toast stack — offset-shadow cards.
 */
import { AnimatePresence, motion } from 'framer-motion';
import {
  CircleCheck,
  CircleX,
  Info,
  Sparkles,
  TriangleAlert,
  Trophy,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useT } from '../hooks/useLanguage';
import type { ToastVariant } from '../types';

const VARIANT_STYLE: Record<ToastVariant, { bg: string; Icon: LucideIcon }> = {
  default: { bg: '#c084fc', Icon: Sparkles },
  success: { bg: '#4ade80', Icon: CircleCheck },
  levelup: { bg: '#facc15', Icon: Trophy },
  warning: { bg: '#fbbf24', Icon: TriangleAlert },
  danger: { bg: '#f87171', Icon: CircleX },
  info: { bg: '#38bdf8', Icon: Info },
};

export function ToastNotification() {
  const { toasts, dismiss } = useToast();
  const { t: tr } = useT();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 pb-safe sm:items-end">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const { bg, Icon } = VARIANT_STYLE[toast.variant];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="card pointer-events-auto flex w-full max-w-sm items-start gap-3 p-3.5"
              style={{ backgroundColor: bg, color: 'var(--brutal-ink)' }}
            >
              <span className="mt-0.5 shrink-0">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{toast.title}</p>
                {toast.message && (
                  <p className="mt-0.5 text-xs font-semibold opacity-80">
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
                aria-label={tr('common.dismiss')}
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default ToastNotification;
