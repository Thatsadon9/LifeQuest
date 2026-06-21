/**
 * Empty state — dashed brutal frame.
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center border-[2.5px] border-dashed border-[var(--brutal-ink)] bg-surface-2 px-6 py-12 text-center shadow-[4px_4px_0_0_var(--brutal-shadow-color)] ${className ?? ''}`}
      style={{ borderRadius: 'var(--radius-brutal)' }}
    >
      {Icon && (
        <div
          className="mb-3 grid h-14 w-14 place-items-center border-[2.5px] border-[var(--brutal-ink)] bg-warning text-[var(--brutal-ink)] shadow-[3px_3px_0_0_var(--brutal-shadow-color)]"
          style={{ borderRadius: 'var(--radius-brutal)' }}
        >
          <Icon size={24} strokeWidth={2.5} />
        </div>
      )}
      <h3 className="text-base font-bold tracking-tight">{title}</h3>
      {message && (
        <p className="mt-1 max-w-sm text-sm font-medium text-muted">{message}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;
