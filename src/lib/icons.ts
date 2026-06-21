/**
 * Resolve a lucide-react icon component by its (PascalCase) name. Useful for
 * data-driven icons (stats, skill paths) where the name is stored as a string.
 */
import * as Lucide from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const registry = Lucide as unknown as Record<string, LucideIcon | undefined>;

/**
 * Look up an icon by name, falling back to a neutral icon when not found.
 * @example const Icon = getIcon('Brain'); <Icon size={18} />
 */
export function getIcon(name: string, fallback: LucideIcon = Lucide.Sparkles): LucideIcon {
  return registry[name] ?? fallback;
}
