import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, handleApiError } from '@/lib/api';
import { usePageMeta } from '@/lib/seo';
import { fmtDate } from '@/lib/date';
import { useToast } from '@/context/ToastContext';
import AdminShell from '@/components/admin/AdminShell';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/Button';
import { Input, Field, Select } from '@/components/ui/FormFields';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { SlidersHorizontal } from 'lucide-react';

interface InventoryRow {
  variantId: string;
  sku: string;
  variantName: string;
  color: string;
  storage: string;
  productId: string;
  productName: string;
  productSlug: string;
  quantity: number;
  reservedQuantity: number;
  available: number;
  lowStockThreshold: number;
}

export default function AdminInventoryPage() {
  usePageMeta({ title: 'Inventory | Admin' });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-inventory', page],
    queryFn: async () => {
      const res = await api.get('/admin/inventory', { params: { page, limit: 30 } });
      return res.data;
    },
  });

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [row, setRow] = useState<InventoryRow | null>(null);
  const [mode, setMode] = useState<'set' | 'delta'>('set');
  const [value, setValue] = useState('');
  const [threshold, setThreshold] = useState('');

  const update = useMutation({
    mutationFn: (payload: { variantId: string; quantity?: number; delta?: number; lowStockThreshold?: number }) =>
      api.patch(`/admin/inventory/variants/${payload.variantId}`, {
        ...(payload.quantity !== undefined ? { quantity: payload.quantity } : {}),
        ...(payload.delta !== undefined ? { delta: payload.delta } : {}),
        ...(payload.lowStockThreshold !== undefined ? { lowStockThreshold: payload.lowStockThreshold } : {}),
      }),
    onSuccess: async () => {
      toast('Inventory updated', { type: 'success' });
      setAdjustOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
    },
    onError: (err: unknown) => toast(handleApiError(err), { type: 'error' }),
  });

  const openAdjust = (r: InventoryRow) => {
    setRow(r);
    setMode('set');
    setValue('');
    setThreshold(String(r.lowStockThreshold));
    setAdjustOpen(true);
  };

  const items: InventoryRow[] = data?.data ?? [];
  const meta = data?.meta;

  return (
    <AdminShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Inventory</h1>
          <p className="text-sm text-ink-500 mt-1">Track and adjust stock levels</p>
        </div>

        <DataTable<InventoryRow>
          columns={[
            {
              key: 'product',
              label: 'Product',
              render: (_, r) => <div><div className="font-medium">{r.productName}</div><div className="text-xs text-ink-500">{r.sku}</div></div>,
            },
            { key: 'variantName', label: 'Variant', render: (v, r) => <div><div>{v}</div><div className="text-xs text-ink-500">{[r.color, r.storage].filter(Boolean).join(' · ') || '—'}</div></div> },
            {
              key: 'quantity', label: 'Quantity',
              render: (v, r) => (
                <button onClick={() => openAdjust(r)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold ${r.available <= r.lowStockThreshold ? 'bg-red-50 text-red-700' : 'bg-ink-50 text-ink-700'} hover:ring-2 hover:ring-brand-400`}>
                  {v} <SlidersHorizontal size={12} />
                </button>
              ),
            },
            { key: 'reservedQuantity', label: 'Reserved', render: (v) => v },
            { key: 'available', label: 'Available', render: (v, r) => <Badge color={v <= r.lowStockThreshold ? 'error' : 'success'}>{v}</Badge> },
            { key: 'lowStockThreshold', label: 'Threshold', render: (v) => v },
          ]}
          data={items}
          loading={isLoading}
          page={page}
          totalPages={meta?.totalPages}
          onPageChange={setPage}
          keyExtractor={(r) => r.variantId}
          emptyTitle="No inventory"
          emptyDescription="No variants in inventory."
        />

        <Modal open={adjustOpen} onClose={() => setAdjustOpen(false)} title={`Adjust stock — ${row?.productName ?? ''}`}>
          {row && (
            <form onSubmit={(e) => { e.preventDefault(); update.mutate({ variantId: row.variantId, ...(mode === 'set' ? { quantity: Number(value) } : { delta: Number(value) }), lowStockThreshold: Number(threshold) }); }} className="space-y-4">
              <Field label="Mode">
                <Select value={mode} onChange={(e) => setMode(e.target.value as 'set' | 'delta')}>
                  <option value="set">Set quantity</option>
                  <option value="delta">Add / subtract (delta)</option>
                </Select>
              </Field>
              <Field label={mode === 'set' ? 'New quantity' : 'Adjustment (can be negative)'} htmlFor="adj-qty">
                <Input id="adj-qty" type="number" required value={value} onChange={(e) => setValue(e.target.value)} />
              </Field>
              <Field label="Low stock threshold" htmlFor="adj-threshold">
                <Input id="adj-threshold" type="number" min="0" required value={threshold} onChange={(e) => setThreshold(e.target.value)} />
              </Field>
              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={update.isPending}>Save</Button>
                <Button type="button" variant="outline" onClick={() => setAdjustOpen(false)}>Cancel</Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </AdminShell>
  );
}
