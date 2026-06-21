/**
 * Skeleton loading primitives — Neo Brutalism shimmer blocks.
 */
import type { ReactNode } from 'react';

export interface SkeletonScreenProps {
  label: string;
  children: ReactNode;
  className?: string;
}

/** Accessible loading wrapper — use on full-page skeleton states. */
export function SkeletonScreen({ label, children, className = '' }: SkeletonScreenProps) {
  return (
    <div
      className={`space-y-4 ${className}`.trim()}
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export interface SkProps {
  className?: string;
}

/** Base shimmer block. */
export function Sk({ className = '' }: SkProps) {
  return (
    <div
      className={`skeleton-shimmer rounded-xl border-2 border-[var(--brutal-ink)]/10 bg-surface-2 ${className}`.trim()}
      aria-hidden
    />
  );
}

export interface SkCardProps {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}

export function SkCard({ children, className = '', padded = true }: SkCardProps) {
  return (
    <div className={`card overflow-hidden ${padded ? 'p-4' : ''} ${className}`.trim()}>
      {children}
    </div>
  );
}

export interface SkLinesProps {
  count?: number;
  className?: string;
}

/** Stacked text-line placeholders. */
export function SkLines({ count = 2, className = '' }: SkLinesProps) {
  const widths = ['w-full', 'w-5/6', 'w-2/3', 'w-1/2'];
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {Array.from({ length: count }).map((_, i) => (
        <Sk key={i} className={`h-3 ${widths[i % widths.length]}`} />
      ))}
    </div>
  );
}

export interface SkListProps {
  count?: number;
  className?: string;
}

/** Card-shaped list rows (quests, habits, settings). */
export function SkList({ count = 3, className = '' }: SkListProps) {
  return (
    <div className={`space-y-2.5 ${className}`.trim()}>
      {Array.from({ length: count }).map((_, i) => (
        <SkCard key={i}>
          <Sk className="h-5 w-40" />
          <Sk className="mt-3 h-3 w-full" />
          <div className="mt-3 flex gap-2">
            <Sk className="h-5 w-16 rounded-full" />
            <Sk className="h-5 w-14 rounded-full" />
          </div>
        </SkCard>
      ))}
    </div>
  );
}

export interface SkPageHeaderProps {
  className?: string;
}

export function SkPageHeader({ className = '' }: SkPageHeaderProps) {
  return (
    <header className={`space-y-2 ${className}`.trim()}>
      <Sk className="h-8 w-48" />
      <Sk className="h-4 w-64 max-w-full" />
    </header>
  );
}

export interface SkSettingCardProps {
  className?: string;
}

export function SkSettingCard({ className = '' }: SkSettingCardProps) {
  return (
    <SkCard className={className}>
      <div className="flex items-start gap-3">
        <Sk className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Sk className="h-4 w-32" />
          <Sk className="h-3 w-full" />
        </div>
      </div>
      <Sk className="mt-4 h-11 w-full rounded-xl" />
    </SkCard>
  );
}
