import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/format';
import type { ProductSummary } from '@/types';

interface DesktopMegaMenuProps {
  category: string;
  onClose: () => void;
}

export default function DesktopMegaMenu({ category, onClose }: DesktopMegaMenuProps) {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['products', category, 'featured'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { category, sort: 'featured', limit: 4 } });
      return res.data.data as ProductSummary[];
    },
    staleTime: 60_000,
  });

  return (
    <div
      className="absolute left-0 top-full pt-2 z-50"
      onMouseLeave={onClose}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-ink-100 p-6 w-[520px] animate-fadeIn">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-3">Featured</h4>
            <div className="space-y-3">
              {data?.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { navigate(`/product/${p.slug}`); onClose(); }}
                  className="flex items-center gap-3 w-full text-left hover:bg-ink-50 rounded-xl p-2 -m-2 transition-colors"
                >
                  <img src={p.images?.[0]?.url} alt={p.images?.[0]?.alt || p.name} className="w-12 h-12 rounded-lg object-cover bg-ink-50" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink-900 truncate">{p.name}</div>
                    <div className="text-sm text-ink-500">{formatINR(p.basePrice)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-3">Browse</h4>
            <div className="space-y-2">
              <button onClick={() => { navigate(`/products/${category}`); onClose(); }} className="block w-full text-left text-sm text-ink-700 hover:text-brand-600 py-1">
                Shop all {category}
              </button>
              <button onClick={() => { navigate('/products?sort=newest'); onClose(); }} className="block w-full text-left text-sm text-ink-700 hover:text-brand-600 py-1">
                New arrivals
              </button>
              <button onClick={() => { navigate('/products?sort=featured'); onClose(); }} className="block w-full text-left text-sm text-ink-700 hover:text-brand-600 py-1">
                Featured
              </button>
              <button onClick={() => { navigate('/products?offers=true'); onClose(); }} className="block w-full text-left text-sm text-ink-700 hover:text-brand-600 py-1">
                Offers
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
