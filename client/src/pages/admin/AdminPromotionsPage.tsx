import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, handleApiError } from '@/lib/api';
import { usePageMeta } from '@/lib/seo';
import { toDatetimeLocal } from '@/lib/date';
import { useToast } from '@/context/ToastContext';
import AdminShell from '@/components/admin/AdminShell';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/Button';
import { Input, Field, Select, Checkbox, Textarea } from '@/components/ui/FormFields';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import type { ProductSummary } from '@/types';
import { Pencil, Trash2, Plus } from 'lucide-react';

interface PromoRow {
  id: number;
  name: string;
  slug: string;
  description?: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  startsAt: string;
  endsAt?: string | null;
  isActive: boolean;
  productIds?: number[];
}

interface PromoForm {
  name: string;
  slug: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  productIds: number[];
}

function emptyForm(): PromoForm {
  const now = new Date();
  return {
    name: '', slug: '', description: '', discountType: 'percent', discountValue: '',
    startsAt: toDatetimeLocal(now), endsAt: '', isActive: true, productIds: [],
  };
}

export default function AdminPromotionsPage() {
  usePageMeta({ title: 'Promotions | Admin' });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: promotions, isLoading } = useQuery<PromoRow[]>({
    queryKey: ['admin-promotions'],
    queryFn: async () => { const res = await api.get('/admin/promotions'); return res.data.data; },
  });

  const products = useQuery<{ data: ProductSummary[] }>({
    queryKey: ['admin-promo-products'],
    queryFn: async () => { const res = await api.get('/products', { params: { limit: 100 } }); return res.data; },
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PromoRow | null>(null);
  const [form, setForm] = useState<PromoForm>(emptyForm());

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState<PromoRow | null>(null);

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (p: PromoRow) => {
    setEditing(p);
    setForm({
      name: p.name, slug: p.slug, description: p.description || '',
      discountType: p.discountType, discountValue: String(p.discountValue),
      startsAt: toDatetimeLocal(p.startsAt), endsAt: p.endsAt ? toDatetimeLocal(p.endsAt) : '',
      isActive: p.isActive, productIds: p.productIds || [],
    });
    setModalOpen(true);
  };

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name, slug: form.slug, description: form.description || undefined,
        discountType: form.discountType, discountValue: Number(form.discountValue),
        startsAt: new Date(form.startsAt).toISOString(), endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
        isActive: form.isActive, productIds: form.productIds,
      };
      if (editing) return api.patch(`/admin/promotions/${editing.id}`, body);
      return api.post('/admin/promotions', body);
    },
    onSuccess: async () => {
      toast(editing ? 'Promotion updated' : 'Promotion created', { type: 'success' });
      setModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      await queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
    onError: (err: unknown) => toast(handleApiError(err), { type: 'error' }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/promotions/${id}`),
    onSuccess: async () => {
      toast('Promotion deleted', { type: 'success' });
      setConfirmOpen(false);
      setDeleting(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      await queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
    onError: (err: unknown) => toast(handleApiError(err), { type: 'error' }),
  });

  const toggleProduct = (id: number) => {
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id) ? f.productIds.filter((x) => x !== id) : [...f.productIds, id],
    }));
  };

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink-900">Promotions</h1>
            <p className="text-sm text-ink-500 mt-1">Create discounts and campaigns</p>
          </div>
          <Button onClick={openAdd}><Plus size={16} className="mr-1.5" /> Add promotion</Button>
        </div>

        <DataTable<PromoRow>
          columns={[
            { key: 'name', label: 'Name', render: (v, r) => <div><div className="font-medium">{v}</div><div className="text-xs text-ink-500">{r.slug}</div></div> },
            { key: 'discountType', label: 'Type', render: (v) => (v === 'percent' ? '%' : '₹') },
            { key: 'discountValue', label: 'Value', render: (v, r) => (r.discountType === 'percent' ? `${v}%` : `₹${v}`) },
            {
              key: 'dates', label: 'Dates',
              render: (_, r) => <div className="text-xs"><div>From {new Date(r.startsAt).toLocaleDateString('en-IN')}</div>{r.endsAt && <div>To {new Date(r.endsAt).toLocaleDateString('en-IN')}</div>}</div>,
            },
            { key: 'isActive', label: 'Status', render: (v) => v ? <Badge color="success">Active</Badge> : <Badge>Inactive</Badge> },
            {
              key: 'actions', label: 'Actions',
              render: (_, r) => (
                <div className="flex gap-1">
                  <button onClick={() => openEdit(r)} className="p-1.5 rounded-full hover:bg-ink-100 text-ink-500"><Pencil size={14} /></button>
                  <button onClick={() => { setDeleting(r); setConfirmOpen(true); }} className="p-1.5 rounded-full hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                </div>
              ),
            },
          ]}
          data={promotions ?? []}
          loading={isLoading}
          keyExtractor={(r) => r.id}
          emptyTitle="No promotions"
          emptyDescription="Create a promotion to get started."
        />

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit promotion' : 'Add promotion'} size="lg">
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name" htmlFor="pr-name"><Input id="pr-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
              <Field label="Slug" htmlFor="pr-slug"><Input id="pr-slug" required value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} /></Field>
            </div>
            <Field label="Description" htmlFor="pr-desc">
              <Textarea id="pr-desc" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Discount type" htmlFor="pr-type">
                <Select id="pr-type" value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as 'percent' | 'fixed' }))}>
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed</option>
                </Select>
              </Field>
              <Field label="Discount value" htmlFor="pr-value">
                <Input id="pr-value" type="number" min="0" required value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Starts at" htmlFor="pr-start">
                <Input id="pr-start" type="datetime-local" required value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
              </Field>
              <Field label="Ends at" htmlFor="pr-end">
                <Input id="pr-end" type="datetime-local" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
              </Field>
            </div>
            <Checkbox label="Active" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />

            <div>
              <h4 className="text-sm font-semibold text-ink-900 mb-2">Apply to products</h4>
              <div className="max-h-56 overflow-auto border border-ink-200 rounded-xl p-3 space-y-1">
                {products.data?.data?.length === 0 && <p className="text-sm text-ink-500">No products found.</p>}
                {products.data?.data?.map((p) => (
                  <label key={p.id} className="flex items-center gap-3 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.productIds.includes(p.id)}
                      onChange={() => toggleProduct(p.id)}
                      className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                    />
                    <div><div className="text-sm">{p.name}</div><div className="text-xs text-ink-500">{p.slug}</div></div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={save.isPending}>{editing ? 'Save changes' : 'Create promotion'}</Button>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Modal>

        <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete promotion">
          <p className="text-sm text-ink-600 mb-4">Delete <strong>{deleting?.name}</strong>?</p>
          <div className="flex gap-3">
            <Button variant="danger" loading={remove.isPending} onClick={() => deleting && remove.mutate(deleting.id)}>Delete</Button>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
          </div>
        </Modal>
      </div>
    </AdminShell>
  );
}
