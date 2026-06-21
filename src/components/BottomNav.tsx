/**
 * Mobile bottom navigation — chunky brutal tabs.
 */
import { NavLink } from 'react-router-dom';
import { useNavItems } from '../hooks';

export function BottomNav() {
  const items = useNavItems().filter((i) => i.core);
  return (
    <nav className="shell-brutal fixed inset-x-0 bottom-0 z-40 border-t-[3px] pb-safe md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            {({ isActive }) => (
              <span
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-bold ${
                  isActive ? 'text-[var(--color-on-primary)]' : 'text-muted'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: 'var(--color-primary)',
                        boxShadow: 'inset 0 -3px 0 var(--brutal-ink)',
                      }
                    : undefined
                }
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default BottomNav;
