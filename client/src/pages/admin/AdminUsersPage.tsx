import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, handleApiError } from '@/lib/api';
import { usePageMeta } from '@/lib/seo';
import { fmtDateTime } from '@/lib/date';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import AdminShell from '@/components/admin/AdminShell';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/FormFields';

const ROLES = ['CUSTOMER', 'MANAGER', 'ADMIN'];

export default function AdminUsersPage() {
  usePageMeta({ title: 'Users | Admin' });
  const { user: me } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, q, role],
    queryFn: async () => {
      const res = await api.get('/admin/users', { params: { page, limit: 20, q: q || undefined, role: role || undefined } });
      return res.data;
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: async () => {
      toast('Role updated', { type: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: unknown) => toast(handleApiError(err), { type: 'error' }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => api.patch(`/admin/users/${id}/status`, { isActive }),
    onSuccess: async () => {
      toast('User status updated', { type: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: unknown) => toast(handleApiError(err), { type: 'error' }),
  });

  const users = data?.data ?? [];
  const meta = data?.meta;

  return (
    <AdminShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Users</h1>
          <p className="text-sm text-ink-500 mt-1">Manage customer accounts and roles</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <input
            placeholder="Search..."
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            className="w-full max-w-xs rounded-full border px-4 py-2.5 text-sm border-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="w-40">
            <option value="">All roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </div>

        <DataTable
          columns={[
            {
              key: 'name', label: 'User',
              render: (_, row: any) => (
                <div><div className="font-medium">{row.firstName} {row.lastName}</div><div className="text-xs text-ink-500">{row.email}</div></div>
              ),
            },
            { key: 'phone', label: 'Phone', render: (v: string) => v || '—' },
            {
              key: 'role', label: 'Role',
              render: (v: string, row: any) => (
                <select
                  value={v}
                  disabled={row.id === me?.id}
                  onChange={(e) => roleMutation.mutate({ id: row.id, role: e.target.value })}
                  className="text-xs border border-ink-300 rounded-full px-2 py-1 bg-white disabled:opacity-50"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              ),
            },
            {
              key: 'status', label: 'Status',
              render: (_, row: any) => (
                <button
                  onClick={() => statusMutation.mutate({ id: row.id, isActive: !row.isActive })}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${row.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                >
                  {row.isActive ? 'Active' : 'Inactive'}
                </button>
              ),
            },
            { key: 'createdAt', label: 'Created', render: (v: string) => fmtDateTime(v) },
          ]}
          data={users}
          loading={isLoading}
          page={page}
          totalPages={meta?.totalPages}
          onPageChange={setPage}
          keyExtractor={(row: any) => row.id}
          emptyTitle="No users"
          emptyDescription="No users match your search."
        />
      </div>
    </AdminShell>
  );
}
