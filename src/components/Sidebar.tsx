/**
 * Desktop left navigation — Neo Brutalism shell.
 */
import { NavLink } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useNavItems, useT } from '../hooks';

export function Sidebar() {
  const items = useNavItems();
  const { t } = useT();

  return (
    <aside className="shell-brutal fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r-[2.5px] pt-safe md:flex">
      <div className="flex items-center gap-3 border-b-[2.5px] border-[var(--brutal-ink)] px-5 py-5">
        <span className="grid h-11 w-11 place-items-center rounded-[var(--radius-brutal)] brutal-header">
          <Sparkles size={22} strokeWidth={2.5} />
        </span>
        <div>
          <p className="text-base font-bold leading-tight tracking-tight">LifeQuest</p>
          <p className="text-xs font-semibold text-secondary">{t('layout.tagline')}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 px-3 py-4">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            {({ isActive }) => (
              <span className="nav-brutal" data-active={isActive ? 'true' : 'false'}>
                <item.icon size={18} strokeWidth={2.5} />
                <span>{item.label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <p className="border-t-[2.5px] border-[var(--brutal-ink)] px-5 py-4 text-xs font-semibold text-secondary">
        {t('layout.footer')}
      </p>
    </aside>
  );
}

export default Sidebar;
