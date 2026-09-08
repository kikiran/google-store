import { NavLink, Outlet } from 'react-router-dom';
import { User, MapPin, Package, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import clsx from 'clsx';
import { useState } from 'react';

const navItems = [
  { to: '/account', label: 'Overview', icon: User, end: true },
  { to: '/account/profile', label: 'Profile', icon: User },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  { to: '/account/orders', label: 'Orders', icon: Package },
];

export default function AccountShell() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() : '?';

  return (
    <div className="container-nova py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-lg">
          {initials}
        </div>
        <div>
          <h1 className="text-lg font-semibold text-ink-900">{user?.firstName} {user?.lastName}</h1>
          <p className="text-sm text-ink-500">{user?.email}</p>
        </div>
      </div>

      <div className="flex gap-8">
        <aside className="hidden md:block w-56 shrink-0">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive ? 'bg-brand-50 text-brand-600 font-medium' : 'text-ink-600 hover:bg-ink-100',
                  )
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center justify-between w-full px-4 py-2.5 bg-ink-50 rounded-lg mb-4 text-sm font-medium text-ink-700"
          >
            Menu
            <ChevronDown size={16} className={clsx('transition-transform', mobileOpen && 'rotate-180')} />
          </button>
          {mobileOpen && (
            <nav className="md:hidden space-y-1 mb-4 bg-ink-50 rounded-lg p-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                      isActive ? 'bg-brand-50 text-brand-600 font-medium' : 'text-ink-600 hover:bg-ink-100',
                    )
                  }
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}
          <Outlet />
        </div>
      </div>
    </div>
  );
}
