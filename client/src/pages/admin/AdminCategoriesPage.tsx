import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, handleApiError } from '@/lib/api';
import { usePageMeta } from '@/lib/seo';
import { useToast } from '@/context/ToastContext';
import AdminShell from '@/components/admin/AdminShell';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/Button';
import { Input, Field, Checkbox } from '@/components/ui/FormFields';
import { Modal } from '@/components/ui/Modal';
import { Pencil, Trash2, Plus } from 'lucide-react';
import type { Category } from '@/types';

interface CatForm {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  icon: string;
  sortOrder: string;
  isActive: boolean;
}

const empty: CatForm = { name: '', slug: '', description: '', imageUrl: '', icon: '', sortOrder: '0', isActive: true };

export default function AdminCategoriesPage() {
  usePageMeta({ title: 'Categories | Admin' });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => { const res = await api.get('/categories'); return res.data.data; },
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CatForm>(empty);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const openAdd = () => { setEditing(null); setForm(empty); setModalOpen(true); };
  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description || '', imageUrl: c.imageUrl || '', icon: c.icon || '', sortOrder: '0', isActive: true });
    setModalOpen(true);
  };

  const save = useMutation({
    mutationFn: (payload: CatForm) => {
      const body = { name: payload.name, slug: payload.slug, description: payload.description || undefined, imageUrl: payload.imageUrl || undefined, icon: payload.icon || undefined, sortOrder: Number(payload.sortOrder || 0), isActive: payload.isActive };
      if (editing) return api.patch(`/admin/categories/${editing.id}`, body);
      return api.post('/admin/categories', body);
    },
    onSuccess: async () => {
      toast(editing ? 'Category updated' : 'Category created', { type: 'success' });
      setModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: unknown) => toast(handleApiError(err), { type: 'error' }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/categories/${id}`),
    onSuccess: async () => {
      toast('Category deleted', { type: 'success' });
      setConfirmOpen(false);
      setDeleting(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: unknown) => toast(handleApiError(err), { type: 'error' }),
  });

  const set = (k: keyof CatForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink-900">Categories</h1>
            <p className="text-sm text-ink-500 mt-1">Organize your catalog</p>
          </div>
          <Button onClick={openAdd}><Plus size={16} className="mr-1.5" /> Add category</Button>
        </div>

        <DataTable<Category>
          columns={[
            {
              key: 'name', label: 'Category',
              render: (_, row) => (
                <div className="flex items-center gap-3">
                  {row.imageUrl && <img src={row.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-ink-50" />}
                  <div><div className="font-medium">{row.name}</div><div className="text-xs text-ink-500">{row.slug}</div></div>
                </div>
              ),
            },
            { key: 'description', label: 'Description', render: (v) => v || '—' },
            {
              key: 'actions', label: 'Actions',
              render: (_, row) => (
                <div className="flex gap-1">
                  <button onClick={() => openEdit(row)} className="p-1.5 rounded-full hover:bg-ink-100 text-ink-500"><Pencil size={14} /></button>
                  <button onClick={() => { setDeleting(row); setConfirmOpen(true); }} className="p-1.5 rounded-full hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                </div>
              ),
            },
          ]}
          data={categories ?? []}
          loading={isLoading}
          keyExtractor={(row) => row.id}
          emptyTitle="No categories"
          emptyDescription="Add a category to get started."
        />

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit category' : 'Add category'}>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(form); }} className="space-y-4">
            <Field label="Name" htmlFor="c-name"><Input id="c-name" required value={form.name} onChange={set('name')} /></Field>
            <Field label="Slug" htmlFor="c-slug"><Input id="c-slug" required value={form.slug} onChange={set('slug')} /></Field>
            <Field label="Description" htmlFor="c-desc"><Input id="c-desc" value={form.description} onChange={set('description')} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Image URL" htmlFor="c-img"><Input id="c-img" value={form.imageUrl} onChange={set('imageUrl')} /></Field>
              <Field label="Icon" htmlFor="c-icon"><Input id="c-icon" value={form.icon} onChange={set('icon')} /></Field>
            </div>
            <Field label="Sort order" htmlFor="c-sort"><Input id="c-sort" type="number" value={form.sortOrder} onChange={set('sortOrder')} /></Field>
            <Checkbox label="Active" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={save.isPending}>{editing ? 'Save changes' : 'Create category'}</Button>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Modal>

        <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete category">
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
