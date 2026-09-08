import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, Boxes, Tags, ClipboardList, Users, BarChart3, Star, Megaphone } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/promotions', label: 'Promotions', icon: Megaphone },
];

export default function AdminShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-[80vh]">
      <aside className="hidden lg:flex flex-col w-60 bg-ink-50 border-r border-ink-200 py-6 px-4 shrink-0">
        <div className="flex items-center gap-2 mb-6 px-2">
          <LayoutDashboard size={18} className="text-brand-600" />
          <span className="text-sm font-semibold text-ink-900">Admin</span>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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
      <div className="flex-1 p-6 overflow-auto">
        {children ?? <Outlet />}
      </div>
    </div>
  );
}
