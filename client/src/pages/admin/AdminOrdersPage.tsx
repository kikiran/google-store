import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, handleApiError } from '@/lib/api';
import { usePageMeta } from '@/lib/seo';
import { formatINR } from '@/lib/format';
import { fmtDateTime } from '@/lib/date';
import { useToast } from '@/context/ToastContext';
import AdminShell from '@/components/admin/AdminShell';
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Select } from '@/components/ui/FormFields';
import type { Order } from '@/types';

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

export default function AdminOrdersPage() {
  usePageMeta({ title: 'Orders | Admin' });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, status],
    queryFn: async () => {
      const res = await api.get('/admin/orders', { params: { page, limit: 20, status: status || undefined } });
      return res.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.patch(`/admin/orders/${id}/status`, { status }),
    onSuccess: async () => {
      toast('Order status updated', { type: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err: unknown) => toast(handleApiError(err), { type: 'error' }),
  });

  const orders: Order[] = data?.data ?? [];
  const meta = data?.meta;

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink-900">Orders</h1>
            <p className="text-sm text-ink-500 mt-1">Manage and update order statuses</p>
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-48">
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>

        <DataTable<Order>
          columns={[
            { key: 'orderNumber', label: 'Order', render: (_, row) => <Link to={`/account/orders/${row.orderNumber}`} className="text-brand-600 hover:underline font-medium">#{row.orderNumber}</Link> },
            { key: 'customer', label: 'Customer', render: (_, row) => <div><div className="font-medium">{row.customerName}</div><div className="text-xs text-ink-500">{row.customerEmail}</div></div> },
            { key: 'placedAt', label: 'Date', render: (v) => fmtDateTime(v) },
            { key: 'grandTotal', label: 'Total', render: (v) => formatINR(v) },
            { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
            { key: 'payment_status', label: 'Payment', render: (v) => <StatusBadge status={v} /> },
            {
              key: 'actions', label: 'Actions',
              render: (_, row) => (
                <select
                  value={row.status}
                  onChange={(e) => statusMutation.mutate({ id: row.id, status: e.target.value })}
                  className="text-xs border border-ink-300 rounded-full px-2 py-1 bg-white"
                >
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              ),
            },
          ]}
          data={orders}
          loading={isLoading}
          page={page}
          totalPages={meta?.totalPages}
          onPageChange={setPage}
          keyExtractor={(row) => row.id}
          emptyTitle="No orders"
          emptyDescription="No orders match your filter."
        />
      </div>
    </AdminShell>
  );
}
