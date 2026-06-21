/**
 * Offline banner — brutal yellow strip.
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useT } from '../hooks';

export function OfflineBanner() {
  const { t } = useT();
  const [offline, setOffline] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine === false,
  );
  const wasOffline = useRef(offline);
  const { toast } = useToast();

  useEffect(() => {
    const sync = (next: boolean) => {
      if (!next && wasOffline.current) {
        toast({
          title: t('offline.backOnline'),
          message: t('offline.backOnlineMessage'),
          variant: 'success',
        });
      }
      wasOffline.current = next;
      setOffline(next);
    };
    const goOnline = () => sync(false);
    const goOffline = () => sync(true);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    sync(navigator.onLine === false);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [toast, t]);

  return (
    <AnimatePresence initial={false}>
      {offline && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden border-b-[2.5px] border-[var(--brutal-ink)] bg-warning"
        >
          <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-4 py-2 text-xs font-bold text-[var(--brutal-ink)]">
            <WifiOff size={14} strokeWidth={2.5} className="shrink-0" />
            <span>{t('offline.banner')}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default OfflineBanner;
