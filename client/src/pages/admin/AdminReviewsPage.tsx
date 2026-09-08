import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, handleApiError } from '@/lib/api';
import { usePageMeta } from '@/lib/seo';
import { fmtDateTime } from '@/lib/date';
import { useToast } from '@/context/ToastContext';
import AdminShell from '@/components/admin/AdminShell';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/FormFields';
import { RatingStars } from '@/components/ui/Rating';
import { Check, X } from 'lucide-react';
import type { Review } from '@/types';

type AdminReview = Review & { status: 'PENDING' | 'APPROVED' | 'REJECTED' };

export default function AdminReviewsPage() {
  usePageMeta({ title: 'Reviews | Admin' });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('PENDING');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', page, status],
    queryFn: async () => {
      const res = await api.get('/admin/reviews', { params: { page, limit: 20, status } });
      return res.data;
    },
  });

  const moderate = useMutation({
    mutationFn: ({ id, s }: { id: number; s: 'APPROVED' | 'REJECTED' }) => api.patch(`/admin/reviews/${id}`, { status: s }),
    onSuccess: async (_, vars) => {
      toast(`Review ${vars.s.toLowerCase()}`, { type: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
    onError: (err: unknown) => toast(handleApiError(err), { type: 'error' }),
  });

  const reviews: AdminReview[] = data?.data ?? [];
  const meta = data?.meta;

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink-900">Reviews</h1>
            <p className="text-sm text-ink-500 mt-1">Moderate customer reviews</p>
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-44">
            <option value="PENDING">Pending</option>
            <option value="ALL">All</option>
          </Select>
        </div>

        <DataTable<AdminReview>
          columns={[
            { key: 'productId', label: 'Product', render: (v) => `#${v}` },
            { key: 'userName', label: 'User', render: (v) => <span className="font-medium">{v}</span> },
            { key: 'rating', label: 'Rating', render: (v) => <RatingStars value={v} /> },
            {
              key: 'body', label: 'Review',
              render: (_, r) => (
                <div><div className="font-medium">{r.title}</div><div className="text-xs text-ink-500 line-clamp-2 max-w-xs">{r.body}</div></div>
              ),
            },
            { key: 'createdAt', label: 'Created', render: (v) => fmtDateTime(v) },
            {
              key: 'actions', label: 'Actions',
              render: (_, r) => {
                if (r.status === 'APPROVED' || r.status === 'REJECTED') {
                  return <span className="text-xs text-ink-400">{r.status}</span>;
                }
                return (
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" loading={moderate.isPending} onClick={() => moderate.mutate({ id: r.id, s: 'APPROVED' })}>
                      <Check size={14} className="mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="danger" loading={moderate.isPending} onClick={() => moderate.mutate({ id: r.id, s: 'REJECTED' })}>
                      <X size={14} className="mr-1" /> Reject
                    </Button>
                  </div>
                );
              },
            },
          ]}
          data={reviews}
          loading={isLoading}
          page={page}
          totalPages={meta?.totalPages}
          onPageChange={setPage}
          keyExtractor={(r) => r.id}
          emptyTitle="No reviews"
          emptyDescription={status === 'PENDING' ? 'No pending reviews.' : 'No reviews found.'}
        />
      </div>
    </AdminShell>
  );
}
