/**
 * Shared navigation config used by both `Sidebar` and `BottomNav` (`core` tabs).
 */
import {
  ClipboardCheck,
  House,
  MessageCircle,
  Network,
  Settings,
  User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavLabelKey =
  | 'today'
  | 'character'
  | 'mira'
  | 'skills'
  | 'review'
  | 'settings';

export interface NavItem {
  to: string;
  labelKey: NavLabelKey;
  icon: LucideIcon;
  /** Pass `end` to NavLink so the index route matches exactly. */
  end?: boolean;
  /** Shown in the mobile bottom nav. */
  core?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', labelKey: 'today', icon: House, end: true, core: true },
  { to: '/character', labelKey: 'character', icon: User, core: true },
  { to: '/mira', labelKey: 'mira', icon: MessageCircle, core: true },
  { to: '/skills', labelKey: 'skills', icon: Network },
  { to: '/review', labelKey: 'review', icon: ClipboardCheck, core: true },
  { to: '/settings', labelKey: 'settings', icon: Settings, core: true },
];
