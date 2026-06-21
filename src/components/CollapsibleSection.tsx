/**
 * Collapsible section — keeps secondary content out of the way until needed.
 */
import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  /** When true, section stays expanded (e.g. recovery mode). */
  forceOpen?: boolean;
  children: ReactNode;
  id?: string;
}

export function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  forceOpen,
  children,
  id,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const expanded = forceOpen ?? open;

  return (
    <section id={id} className="space-y-2.5">
      <button
        type="button"
        onClick={() => !forceOpen && setOpen((v) => !v)}
        className="focus-ring flex w-full items-center gap-2 px-1 text-left"
        aria-expanded={expanded}
      >
        <h2 className="text-sm font-bold">{title}</h2>
        {subtitle && (
          <span className="text-xs font-semibold text-secondary">{subtitle}</span>
        )}
        {!forceOpen && (
          <ChevronDown
            size={18}
            strokeWidth={2.5}
            className={`ml-auto shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        )}
      </button>
      {expanded && children}
    </section>
  );
}

export default CollapsibleSection;
