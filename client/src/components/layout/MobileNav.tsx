import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import SearchBar from '@/components/search/SearchBar';
import type { Category } from '@/types';

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data as Category[];
    },
    staleTime: 120_000,
  });

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Hamburger - visible only from header via the button below; the panel is always in DOM */}
      <div
        className={`fixed inset-0 z-50 bg-white transition-transform ${open ? 'translate-x-0' : '-translate-x-full'} lg:hidden`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-ink-100">
          <span className="text-lg font-bold text-ink-900">Menu</span>
          <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-ink-100">
            <X size={22} />
          </button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100vh-64px)]">
          <SearchBar autoFocus onNavigate={() => setOpen(false)} />

          <div className="space-y-1 pt-2">
            <button
              onClick={() => setOpen(false)}
              className="w-full"
            >
              <Link to="/products" className="block py-3 text-base font-medium text-ink-900 border-b border-ink-100">
                All Products
              </Link>
            </button>
            {categories?.map((cat) => (
              <Link
                key={cat.slug}
                to={`/products/${cat.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between py-3 text-base font-medium text-ink-900 border-b border-ink-100 min-h-[44px]"
              >
                {cat.name}
                <ChevronRight size={18} className="text-ink-400" />
              </Link>
            ))}
            <Link to="/products?offers=true" onClick={() => setOpen(false)} className="block py-3 text-base font-medium text-ink-900 border-b border-ink-100">
              Offers
            </Link>
          </div>

          <div className="pt-4 space-y-2">
            {isAuthenticated ? (
              <>
                <Link to="/account" onClick={() => setOpen(false)} className="block py-2 text-sm text-ink-700">Account</Link>
                <Link to="/account/orders" onClick={() => setOpen(false)} className="block py-2 text-sm text-ink-700">Orders</Link>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="block py-2 text-sm text-ink-700">Sign in</Link>
            )}
          </div>
        </div>
      </div>

      {/* Hamburger trigger - lives inside header but we need to open it from here. Use window event. */}
      <HamburgerTrigger onOpen={() => setOpen(true)} />
    </>
  );
}

function HamburgerTrigger({ onOpen }: { onOpen: () => void }) {
  const { pathname } = window.location;
  // Render hamburger inside header area - we use a portal-like approach with CSS
  // Actually let's just expose via a simple global event
  useEffect(() => {
    const handler = () => onOpen();
    window.addEventListener('nova:open-mobile-nav', handler);
    return () => window.removeEventListener('nova:open-mobile-nav', handler);
  }, [onOpen]);
  return null;
}
