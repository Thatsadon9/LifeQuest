/**
 * Toast notifications: a small queue managed by `ToastProvider` and consumed
 * via `useToast()`. The visual rendering lives in
 * `components/ToastNotification.tsx`.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { Toast, ToastInput } from '../types';

interface ToastContextValue {
  /** The current queue (oldest first). */
  toasts: Toast[];
  /** Enqueue a toast; returns its id. Auto-dismisses after `duration`. */
  toast: (input: ToastInput) => string;
  /** Remove a toast immediately. */
  dismiss: (id: string) => void;
  /** Remove all toasts. */
  clear: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ToastProvider({
  children,
  duration = 4000,
}: {
  children: ReactNode;
  /** Auto-dismiss delay in ms. */
  duration?: number;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = input.id ?? genId();
      const next: Toast = {
        id,
        title: input.title,
        message: input.message,
        variant: input.variant ?? 'default',
      };
      setToasts((ts) => [...ts.filter((t) => t.id !== id), next]);
      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismiss, duration],
  );

  const clear = useCallback(() => {
    setToasts([]);
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
  }, []);

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, toast, dismiss, clear }),
    [toasts, toast, dismiss, clear],
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

/** Access the toast queue and controls. Must be used within `ToastProvider`. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
