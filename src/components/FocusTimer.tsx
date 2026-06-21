/**
 * FocusTimer — Pomodoro timer for Focus Mode.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Coffee, Pause, Play, RotateCcw, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useT } from '../hooks';

export type FocusPhase = 'focus' | 'break';

export interface FocusTimerProps {
  focusMinutes?: number;
  breakMinutes?: number;
  onPhaseComplete?: (finished: FocusPhase, next: FocusPhase) => void;
  className?: string;
}

const VIEW = 240;
const CENTER = VIEW / 2;
const RADIUS = 104;
const STROKE = 12;
const CIRC = 2 * Math.PI * RADIUS;
const TICK_MS = 200;

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function playChime(next: FocusPhase): void {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const base = next === 'focus' ? 587.33 : 523.25;
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.setValueAtTime(base * 1.5, t + 0.16);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.11, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.9);
    osc.onended = () => void ctx.close();
  } catch {
    /* audio optional */
  }
}

export function FocusTimer({
  focusMinutes = 25,
  breakMinutes = 5,
  onPhaseComplete,
  className,
}: FocusTimerProps) {
  const reduceMotion = useReducedMotion();
  const { t } = useT();

  const [mode, setMode] = useState<FocusPhase>('focus');
  const [running, setRunning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(focusMinutes * 60_000);
  const [rounds, setRounds] = useState(0);

  const endAtRef = useRef<number | null>(null);
  const modeRef = useRef<FocusPhase>(mode);
  const onPhaseCompleteRef = useRef(onPhaseComplete);

  useEffect(() => {
    onPhaseCompleteRef.current = onPhaseComplete;
  }, [onPhaseComplete]);

  const durationMs = useCallback(
    (phase: FocusPhase) =>
      (phase === 'focus' ? focusMinutes : breakMinutes) * 60_000,
    [focusMinutes, breakMinutes],
  );

  const handlePhaseEnd = useCallback(() => {
    const finished = modeRef.current;
    const next: FocusPhase = finished === 'focus' ? 'break' : 'focus';
    const nextMs = durationMs(next);
    endAtRef.current = Date.now() + nextMs;
    modeRef.current = next;
    setMode(next);
    setRemainingMs(nextMs);
    if (finished === 'focus') setRounds((r) => r + 1);
    playChime(next);
    onPhaseCompleteRef.current?.(finished, next);
  }, [durationMs]);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const end = endAtRef.current;
      if (end == null) return;
      const left = end - Date.now();
      if (left <= 0) {
        handlePhaseEnd();
      } else {
        setRemainingMs(left);
      }
    };
    const id = window.setInterval(tick, TICK_MS);
    tick();
    return () => window.clearInterval(id);
  }, [running, handlePhaseEnd]);

  const start = useCallback(() => {
    setRunning((prev) => {
      if (prev) return prev;
      endAtRef.current = Date.now() + remainingMs;
      return true;
    });
  }, [remainingMs]);

  const pause = useCallback(() => {
    setRunning((prev) => {
      if (!prev) return prev;
      if (endAtRef.current != null) {
        setRemainingMs(Math.max(0, endAtRef.current - Date.now()));
      }
      endAtRef.current = null;
      return false;
    });
  }, []);

  const reset = useCallback(() => {
    endAtRef.current = null;
    modeRef.current = 'focus';
    setRunning(false);
    setMode('focus');
    setRemainingMs(durationMs('focus'));
    setRounds(0);
  }, [durationMs]);

  const phaseLabel = mode === 'focus' ? t('timer.focus') : t('timer.break');
  const phaseColor = mode === 'focus' ? 'var(--color-primary)' : 'var(--color-success)';
  const PhaseIcon: LucideIcon = mode === 'focus' ? Target : Coffee;

  const total = durationMs(mode);
  const fraction = total > 0 ? Math.min(1, Math.max(0, remainingMs / total)) : 0;
  const offset = CIRC * (1 - fraction);
  const secondsLeft = Math.ceil(remainingMs / 1000);
  const sweep = reduceMotion ? 0 : TICK_MS / 1000;

  const roundLabel =
    rounds === 0 ? t('focus.roundOne') : t('focus.round', { n: rounds + 1 });

  const statusHint = running
    ? mode === 'focus'
      ? t('timer.stayWithIt')
      : t('timer.restALittle')
    : t('timer.ready');

  return (
    <div
      className={`flex flex-col items-center ${className ?? ''}`}
      role="timer"
      aria-label={t('timer.remaining', {
        phase: phaseLabel,
        time: formatClock(secondsLeft),
      })}
    >
      <div className="mb-5 flex items-center gap-2">
        <span
          className="badge-brutal gap-1.5 text-sm"
          style={{ backgroundColor: phaseColor, color: 'var(--brutal-ink)' }}
        >
          <PhaseIcon size={15} strokeWidth={2.5} />
          {phaseLabel}
        </span>
        <span className="text-xs font-medium text-muted">{roundLabel}</span>
      </div>

      <div className="relative grid aspect-square w-64 max-w-[78vw] place-items-center">
        <div
          className="card-flat absolute inset-0 m-auto flex h-full w-full items-center justify-center p-4"
          style={{ borderRadius: 'var(--radius-brutal)' }}
        >
        <svg
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          className="absolute inset-0 h-full w-full -rotate-90"
        >
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="var(--color-surface-2)"
            strokeWidth={STROKE}
          />
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE + 1}
            strokeLinecap="butt"
            strokeDasharray={CIRC}
            initial={false}
            animate={{ strokeDashoffset: offset, stroke: phaseColor }}
            transition={{ duration: sweep, ease: 'linear' }}
          />
        </svg>

        <div className="relative flex flex-col items-center">
          <span className="text-6xl font-bold tabular-nums tracking-tight">
            {formatClock(secondsLeft)}
          </span>
          <span className="mt-1 text-sm font-bold text-muted">{statusHint}</span>
        </div>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (running ? pause() : start())}
          className="btn-brutal btn-brutal-primary px-7 py-3 text-base"
        >
          {running ? <Pause size={20} strokeWidth={2.5} /> : <Play size={20} strokeWidth={2.5} />}
          {running ? t('timer.pause') : t('timer.start')}
        </button>
        <button
          type="button"
          onClick={reset}
          className="btn-brutal btn-brutal-ghost px-5 py-3 text-base"
        >
          <RotateCcw size={18} strokeWidth={2.5} />
          {t('timer.reset')}
        </button>
      </div>
    </div>
  );
}

export default FocusTimer;
