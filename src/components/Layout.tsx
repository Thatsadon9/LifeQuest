/**
 * Responsive app shell — Neo Brutalism top bar + sidebar + bottom nav.
 */
import { Link, Outlet } from 'react-router-dom';
import { Moon, Network, Settings, Sparkles, Sun } from 'lucide-react';
import { useLocalizedLevel, useT } from '../hooks';
import { useTheme } from '../hooks/useTheme';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { OfflineBanner } from './OfflineBanner';
import { XPProgressBar } from './XPProgressBar';

function TopBar() {
  const level = useLocalizedLevel();
  const { theme, toggleTheme } = useTheme();
  const { t } = useT();

  return (
    <header className="shell-brutal sticky top-0 z-30 border-b-[2.5px] pt-safe">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-2.5">
        <Link to="/" className="flex shrink-0 items-center gap-2 md:hidden">
          <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-brutal)] brutal-header">
            <Sparkles size={18} strokeWidth={2.5} />
          </span>
        </Link>

        <div className="min-w-0 flex-1">
          {level ? (
            <div className="flex items-center gap-2">
              <span className="badge-brutal shrink-0 bg-primary text-[var(--color-on-primary)]">
                {t('common.lv')} {level.level}
              </span>
              <span className="hidden shrink-0 text-xs font-bold text-secondary sm:block">
                {level.rank}
              </span>
              <div className="hidden min-w-[80px] max-w-[240px] flex-1 sm:block">
                <XPProgressBar
                  value={level.intoLevel}
                  max={level.neededForNext}
                  hideValue
                />
              </div>
            </div>
          ) : (
            <div className="h-5" />
          )}
        </div>

        <nav className="flex shrink-0 items-center gap-1.5">
          <Link
            to="/skills"
            className="icon-btn-brutal"
            aria-label={t('layout.skillTree')}
          >
            <Network size={18} strokeWidth={2.5} />
          </Link>
          <Link
            to="/settings"
            className="icon-btn-brutal"
            aria-label={t('layout.settings')}
          >
            <Settings size={18} strokeWidth={2.5} />
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="icon-btn-brutal"
            aria-label={t('layout.toggleTheme')}
          >
            {theme === 'dark' ? (
              <Sun size={18} strokeWidth={2.5} />
            ) : (
              <Moon size={18} strokeWidth={2.5} />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}

export function Layout() {
  return (
    <div className="min-h-[100dvh]">
      <Sidebar />
      <div className="md:pl-64">
        <TopBar />
        <OfflineBanner />
        <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5 md:pb-12">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

export default Layout;
