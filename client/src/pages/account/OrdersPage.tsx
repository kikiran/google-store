import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { usePageMeta } from '@/lib/seo';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import OrderCard from '@/components/order/OrderCard';
import type { Order, Paginated } from '@/types';

export default function OrdersPage() {
  usePageMeta({ title: 'My Orders' });
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery<Paginated<Order>>({
    queryKey: ['orders-mine', page],
    queryFn: async () => {
      const res = await api.get('/orders/mine', { params: { page, limit: 10 } });
      return { data: res.data.data, meta: res.data.meta };
    },
  });

  if (isLoading) {
    return <div className="py-12 flex justify-center"><Spinner /></div>;
  }

  if (error) {
    return <ErrorState message="Failed to load orders" onRetry={refetch} />;
  }

  const orders = data?.data ?? [];
  const meta = data?.meta;

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="When you place an order, it will appear here."
        action={{ label: 'Start shopping', onClick: () => navigate('/products') }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-ink-900">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
