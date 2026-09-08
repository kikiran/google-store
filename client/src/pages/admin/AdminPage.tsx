import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { usePageMeta } from '@/lib/seo';
import { formatINR } from '@/lib/format';
import { fmtDateTime } from '@/lib/date';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { Package, ClipboardList, Users, Star, TrendingUp } from 'lucide-react';
import type { Order } from '@/types';

interface AdminMeta { data: any[]; meta: { total: number } };

export default function AdminPage() {
  usePageMeta({ title: 'Admin Dashboard' });

  const products = useQuery<AdminMeta>({ queryKey: ['admin-dash-products'], queryFn: async () => { const r = await api.get('/admin/products', { params: { page: 1, limit: 1 } }); return { data: r.data.data, meta: r.data.meta }; } });
  const orders = useQuery<AdminMeta>({ queryKey: ['admin-dash-orders'], queryFn: async () => { const r = await api.get('/admin/orders', { params: { page: 1, limit: 1 } }); return { data: r.data.data, meta: r.data.meta }; } });
  const users = useQuery<AdminMeta>({ queryKey: ['admin-dash-users'], queryFn: async () => { const r = await api.get('/admin/users', { params: { page: 1, limit: 1 } }); return { data: r.data.data, meta: r.data.meta }; } });
  const reviews = useQuery<AdminMeta>({ queryKey: ['admin-dash-reviews'], queryFn: async () => { const r = await api.get('/admin/reviews', { params: { page: 1, limit: 1, status: 'PENDING' } }); return { data: r.data.data, meta: r.data.meta }; } });

  const recentOrders = useQuery<Order[]>({
    queryKey: ['admin-dash-recent-orders'],
    queryFn: async () => { const r = await api.get('/admin/orders', { params: { page: 1, limit: 5 } }); return r.data.data; },
  });

  const stats = [
    { label: 'Products', value: products.data?.meta?.total ?? '—', icon: Package, to: '/admin/products', color: 'bg-blue-50 text-blue-600' },
    { label: 'Orders', value: orders.data?.meta?.total ?? '—', icon: ClipboardList, to: '/admin/orders', color: 'bg-green-50 text-green-600' },
    { label: 'Users', value: users.data?.meta?.total ?? '—', icon: Users, to: '/admin/users', color: 'bg-purple-50 text-purple-600' },
    { label: 'Pending Reviews', value: reviews.data?.meta?.total ?? '—', icon: Star, to: '/admin/reviews', color: 'bg-amber-50 text-amber-600' },
  ];

  const loading = products.isLoading || orders.isLoading || users.isLoading || reviews.isLoading;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Admin Dashboard</h1>
        <p className="text-sm text-ink-500 mt-1">Overview of your store</p>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Link key={s.label} to={s.to} className="flex items-center gap-4 p-5 rounded-2xl border border-ink-200 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink-900">{s.value}</p>
                <p className="text-sm text-ink-500">{s.label}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-ink-400" />
          <h2 className="text-lg font-semibold text-ink-900">Recent Orders</h2>
        </div>
        {recentOrders.isLoading ? (
          <div className="py-8 flex justify-center"><Spinner /></div>
        ) : !recentOrders.data || recentOrders.data.length === 0 ? (
          <p className="text-sm text-ink-500">No recent orders.</p>
        ) : (
          <div className="bg-white rounded-2xl border border-ink-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink-50 text-left">
                  <th className="px-4 py-3 font-medium text-ink-600">Order</th>
                  <th className="px-4 py-3 font-medium text-ink-600">Customer</th>
                  <th className="px-4 py-3 font-medium text-ink-600">Date</th>
                  <th className="px-4 py-3 font-medium text-ink-600 text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-ink-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.data.map((o) => (
                  <tr key={o.id} className="border-t border-ink-100">
                    <td className="px-4 py-3 font-medium text-ink-900">#{o.orderNumber}</td>
                    <td className="px-4 py-3 text-ink-700">{o.customerName || o.customerEmail}</td>
                    <td className="px-4 py-3 text-ink-500">{fmtDateTime(o.placedAt)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatINR(o.grandTotal)}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
