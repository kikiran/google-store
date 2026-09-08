import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import SearchBar from '@/components/search/SearchBar';
import DesktopMegaMenu from '@/components/layout/DesktopMegaMenu';
import clsx from 'clsx';

const navLinks = [
  { label: 'Phones', href: '/products/phones', category: 'phones' },
  { label: 'Watches & Trackers', href: '/products/watches', category: 'watches' },
  { label: 'Earbuds', href: '/products/earbuds', category: 'earbuds' },
  { label: 'Tablets', href: '/products/tablets', category: 'tablets' },
  { label: 'Accessories', href: '/products/accessories', category: 'accessories' },
  { label: 'Offers', href: '/products?offers=true' },
];

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { count } = useCart();
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-40">
      {/* Utility bar */}
      <div className="hidden lg:block bg-ink-900 text-white text-xs">
        <div className="container-nova flex items-center justify-between py-1.5">
          <div className="flex gap-4">
            <Link to="/account/orders" className="hover:text-brand-200">Orders</Link>
            <Link to="/products" className="hover:text-brand-200">Devices</Link>
            <a href="#" className="hover:text-brand-200">Support</a>
          </div>
          <div className="flex gap-4 items-center">
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setAccountOpen(!accountOpen)} className="flex items-center gap-1 hover:text-brand-200">
                  {user?.firstName} <ChevronDown size={12} />
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white text-ink-900 rounded-xl shadow-lg border border-ink-100 py-2 w-48 animate-fadeIn">
                    <Link to="/account" className="block px-4 py-2 text-sm hover:bg-ink-50">Account</Link>
                    <Link to="/account/orders" className="block px-4 py-2 text-sm hover:bg-ink-50">Orders</Link>
                    {user?.role !== 'CUSTOMER' && <Link to="/admin" className="block px-4 py-2 text-sm hover:bg-ink-50">Admin</Link>}
                    <button onClick={() => { logout(); setAccountOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-ink-50 text-red-600">Sign out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="hover:text-brand-200">Sign in</Link>
            )}
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="bg-white/95 backdrop-blur border-b border-ink-200">
        <div className="container-nova flex items-center justify-between h-16 gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <svg width="28" height="28" viewBox="0 0 100 100">
              <circle cx="25" cy="25" r="8" fill="#2962FF" />
              <circle cx="75" cy="25" r="8" fill="#0ABF96" />
              <circle cx="25" cy="75" r="8" fill="#F59E0B" />
              <circle cx="75" cy="75" r="8" fill="#EF4444" />
            </svg>
            <span className="text-xl font-bold text-ink-900">Nova</span>
          </Link>

          {/* Search - desktop */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <SearchBar className="w-full" onNavigate={() => {}} />
          </div>

          <div className="flex items-center gap-2">
            {/* Search - mobile */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 rounded-full hover:bg-ink-100 text-ink-600"
            >
              <Search size={20} />
            </button>

            <Link to="/cart" className="relative p-2 rounded-full hover:bg-ink-100 text-ink-600">
              <ShoppingCart size={20} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>

            <Link to={isAuthenticated ? '/account' : '/login'} className="p-2 rounded-full hover:bg-ink-100 text-ink-600 hidden lg:block">
              <User size={20} />
            </Link>
          </div>
        </div>

        {/* Mobile search dropdown */}
        {mobileSearchOpen && (
          <div className="md:hidden border-t border-ink-100 px-4 py-3 animate-fadeIn">
            <SearchBar autoFocus onNavigate={() => setMobileSearchOpen(false)} />
          </div>
        )}
      </div>

      {/* Navigation band - desktop */}
      <nav className="hidden lg:block bg-white border-b border-ink-100">
        <div className="container-nova flex items-center gap-1 h-12 relative">
          {navLinks.map((link) => (
            <div
              key={link.href}
              className="relative"
              onMouseEnter={() => link.category && setHoveredNav(link.category)}
              onMouseLeave={() => setHoveredNav(null)}
            >
              <Link
                to={link.href}
                className={clsx(
                  'px-4 py-2 text-sm font-medium transition-colors rounded-full hover:bg-ink-50',
                )}
              >
                {link.label}
                {link.category && <ChevronDown size={12} className="inline ml-1" />}
              </Link>
              {link.category && hoveredNav === link.category && (
                <DesktopMegaMenu category={link.category} onClose={() => setHoveredNav(null)} />
              )}
            </div>
          ))}
        </div>
      </nav>
    </header>
  );
}
