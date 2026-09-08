import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, handleApiError } from '@/lib/api';
import { usePageMeta } from '@/lib/seo';
import { formatINR } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import AdminShell from '@/components/admin/AdminShell';
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input, Field, Select, Checkbox, Textarea } from '@/components/ui/FormFields';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Pencil, Trash2, Plus } from 'lucide-react';
import type { Category, ProductSummary } from '@/types';

interface VariantRow { id?: number; sku: string; name: string; color: string; colorSwatch: string; storage: string; price: string; compareAtPrice: string; isActive: boolean; isDefault: boolean; }
interface ImageRow { id?: number; url: string; altText: string; isPrimary: boolean; sortOrder: number; }
interface SpecRow { id?: number; name: string; value: string; sortOrder: number; }

interface ProductForm {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  brand: string;
  categoryId: string;
  basePrice: string;
  compareAtPrice: string;
  badge: string;
  isFeatured: boolean;
  isNew: boolean;
  status: string;
  featureRank: string;
  variants: VariantRow[];
  images: ImageRow[];
  specifications: SpecRow[];
}

function emptyForm(): ProductForm {
  return {
    name: '', slug: '', tagline: '', description: '', brand: 'Nova', categoryId: '',
    basePrice: '', compareAtPrice: '', badge: '', isFeatured: false, isNew: false,
    status: 'draft', featureRank: '0',
    variants: [{ sku: '', name: 'Default', color: '', colorSwatch: '', storage: '', price: '', compareAtPrice: '', isActive: true, isDefault: true }],
    images: [],
    specifications: [],
  };
}

export default function AdminProductsPage() {
  usePageMeta({ title: 'Products | Admin' });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, q, status],
    queryFn: async () => {
      const res = await api.get('/admin/products', { params: { page, limit: 20, q: q || undefined, status: status || undefined } });
      return res.data;
    },
  });

  const categories = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => { const res = await api.get('/categories'); return res.data.data; },
  });

  const products: ProductSummary[] = data?.data ?? [];
  const meta = data?.meta;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductSummary | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState<ProductSummary | null>(null);

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setModalOpen(true); };

  const openEdit = async (p: ProductSummary) => {
    setEditing(p);
    try {
      const res = await api.get(`/admin/products/${p.id}`);
      const full = res.data.data;
      setForm({
        name: full.name, slug: full.slug, tagline: full.tagline || '', description: full.description || '',
        brand: full.brand || '', categoryId: String(full.category?.id ?? ''), basePrice: String(full.basePrice ?? ''),
        compareAtPrice: full.compareAtPrice != null ? String(full.compareAtPrice) : '', badge: full.badge || '',
        isFeatured: full.isFeatured, isNew: full.isNew, status: full.status || 'draft', featureRank: String(full.featureRank ?? 0),
        variants: (full.variants || []).map((v: any) => ({ id: v.id, sku: v.sku, name: v.name, color: v.color || '', colorSwatch: v.colorSwatch || '', storage: v.storage || '', price: String(v.price ?? ''), compareAtPrice: v.compareAtPrice != null ? String(v.compareAtPrice) : '', isActive: v.isActive ?? true, isDefault: v.isDefault ?? false })),
        images: (full.images || []).map((img: any) => ({ id: img.id, url: img.url, altText: img.alt || img.altText || '', isPrimary: img.isPrimary || false, sortOrder: img.sortOrder ?? 0 })),
        specifications: (full.specifications || []).map((s: any) => ({ id: s.id, name: s.name, value: s.value, sortOrder: s.sortOrder ?? 0 })),
      });
      setModalOpen(true);
    } catch (err) {
      toast(handleApiError(err), { type: 'error' });
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: form.name, slug: form.slug, tagline: form.tagline || undefined, description: form.description || undefined,
        brand: form.brand, categoryId: Number(form.categoryId), basePrice: Number(form.basePrice),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        badge: form.badge || undefined, isFeatured: form.isFeatured, isNew: form.isNew,
        status: form.status, featureRank: Number(form.featureRank || 0),
        variants: form.variants.map((v) => ({ ...(v.id ? { id: v.id } : {}), sku: v.sku, name: v.name, color: v.color || undefined, colorSwatch: v.colorSwatch || undefined, storage: v.storage || undefined, price: Number(v.price), compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined, isActive: v.isActive, isDefault: v.isDefault })),
        images: form.images.map((img) => ({ ...(img.id ? { id: img.id } : {}), url: img.url, altText: img.altText || undefined, isPrimary: img.isPrimary, sortOrder: img.sortOrder })),
        specifications: form.specifications.map((s) => ({ ...(s.id ? { id: s.id } : {}), name: s.name, value: s.value, sortOrder: s.sortOrder })),
      };
      if (editing) return api.patch(`/admin/products/${editing.id}`, payload);
      return api.post('/admin/products', payload);
    },
    onSuccess: async () => {
      toast(editing ? 'Product updated' : 'Product created', { type: 'success' });
      setModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (err: unknown) => toast(handleApiError(err), { type: 'error' }),
    onSettled: () => setSaving(false),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/products/${id}`),
    onSuccess: async () => {
      toast('Product deleted', { type: 'success' });
      setConfirmOpen(false);
      setDeleting(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (err: unknown) => toast(handleApiError(err), { type: 'error' }),
  });

  const setField = (key: keyof ProductForm, value: any) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink-900">Products</h1>
            <p className="text-sm text-ink-500 mt-1">Manage your product catalog</p>
          </div>
          <Button onClick={openAdd}><Plus size={16} className="mr-1.5" /> Add product</Button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Input placeholder="Search..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="max-w-xs" />
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-40">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </Select>
        </div>

        <DataTable<ProductSummary>
          columns={[
            {
              key: 'name', label: 'Product',
              render: (_, row) => (
                <div className="flex items-center gap-3">
                  {row.images?.[0]?.url && <img src={row.images[0].url} alt="" className="w-10 h-10 rounded-lg object-cover bg-ink-50" />}
                  <div><div className="font-medium">{row.name}</div><div className="text-xs text-ink-500">{row.slug}</div></div>
                </div>
              ),
            },
            { key: 'category', label: 'Category', render: (v) => v?.name ?? '—' },
            { key: 'basePrice', label: 'Base price', render: (v) => formatINR(v) },
            { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
            {
              key: 'flags', label: 'Flags',
              render: (_, row) => (
                <div className="flex gap-1">
                  {row.isFeatured && <Badge color="brand">Featured</Badge>}
                  {row.isNew && <Badge color="success">New</Badge>}
                </div>
              ),
            },
            { key: 'variants', label: 'Variants', render: (v) => (v ?? []).length },
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
          data={products}
          loading={isLoading}
          page={page}
          totalPages={meta?.totalPages}
          onPageChange={setPage}
          keyExtractor={(row) => row.id}
          emptyTitle="No products"
          emptyDescription="No products match your criteria."
        />

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit product' : 'Add product'} size="lg">
          <form onSubmit={(e) => { e.preventDefault(); setSaving(true); saveMutation.mutate(); }} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="p-name"><Input id="p-name" required value={form.name} onChange={(e) => setField('name', e.target.value)} /></Field>
              <Field label="Slug" htmlFor="p-slug"><Input id="p-slug" required value={form.slug} onChange={(e) => setField('slug', e.target.value)} /></Field>
              <Field label="Tagline" htmlFor="p-tagline"><Input id="p-tagline" value={form.tagline} onChange={(e) => setField('tagline', e.target.value)} /></Field>
              <Field label="Brand" htmlFor="p-brand"><Input id="p-brand" value={form.brand} onChange={(e) => setField('brand', e.target.value)} /></Field>
              <Field label="Category" htmlFor="p-cat">
                <Select id="p-cat" required value={form.categoryId} onChange={(e) => setField('categoryId', e.target.value)}>
                  <option value="">Select category</option>
                  {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Badge" htmlFor="p-badge"><Input id="p-badge" value={form.badge} onChange={(e) => setField('badge', e.target.value)} /></Field>
              <Field label="Base price" htmlFor="p-price"><Input id="p-price" type="number" min="0" required value={form.basePrice} onChange={(e) => setField('basePrice', e.target.value)} /></Field>
              <Field label="Compare-at price" htmlFor="p-ca"><Input id="p-ca" type="number" min="0" value={form.compareAtPrice} onChange={(e) => setField('compareAtPrice', e.target.value)} /></Field>
            </div>
            <Field label="Description" htmlFor="p-desc">
              <Textarea id="p-desc" rows={3} value={form.description} onChange={(e) => setField('description', e.target.value)} />
            </Field>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Status">
                <Select value={form.status} onChange={(e) => setField('status', e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </Select>
              </Field>
              <Field label="Feature rank">
                <Input type="number" value={form.featureRank} onChange={(e) => setField('featureRank', e.target.value)} />
              </Field>
              <Checkbox label="Featured" checked={form.isFeatured} onChange={(e) => setField('isFeatured', e.target.checked)} />
              <Checkbox label="New" checked={form.isNew} onChange={(e) => setField('isNew', e.target.checked)} />
            </div>

            <VariantsEditor variants={form.variants} onChange={(variants) => setField('variants', variants)} />
            <ImagesEditor images={form.images} onChange={(images) => setField('images', images)} />
            <SpecsEditor specs={form.specifications} onChange={(specs) => setField('specifications', specs)} />

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Create product'}</Button>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Modal>

        <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete product">
          <p className="text-sm text-ink-600 mb-4">Are you sure you want to delete <strong>{deleting?.name}</strong>? This will soft-delete the product.</p>
          <div className="flex gap-3">
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleting && deleteMutation.mutate(deleting.id)}>Delete</Button>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
          </div>
        </Modal>
      </div>
    </AdminShell>
  );
}

function VariantsEditor({ variants, onChange }: { variants: VariantRow[]; onChange: (v: VariantRow[]) => void }) {
  const update = (i: number, patch: Partial<VariantRow>) => onChange(variants.map((v, idx) => idx === i ? { ...v, ...patch } : v));
  const add = () => onChange([...variants, { sku: '', name: '', color: '', colorSwatch: '', storage: '', price: '', compareAtPrice: '', isActive: true, isDefault: false }]);
  const remove = (i: number) => onChange(variants.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-ink-900">Variants</h4>
        <Button type="button" variant="outline" size="sm" onClick={add}><Plus size={14} className="mr-1" /> Add</Button>
      </div>
      {variants.map((v, i) => (
        <div key={i} className="border border-ink-200 rounded-xl p-3 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="SKU" htmlFor={`v-sku-${i}`}><Input id={`v-sku-${i}`} required value={v.sku} onChange={(e) => update(i, { sku: e.target.value })} /></Field>
            <Field label="Name" htmlFor={`v-name-${i}`}><Input id={`v-name-${i}`} value={v.name} onChange={(e) => update(i, { name: e.target.value })} /></Field>
            <Field label="Color" htmlFor={`v-color-${i}`}><Input id={`v-color-${i}`} value={v.color} onChange={(e) => update(i, { color: e.target.value })} /></Field>
            <Field label="Color swatch" htmlFor={`v-swatch-${i}`}><Input id={`v-swatch-${i}`} value={v.colorSwatch} onChange={(e) => update(i, { colorSwatch: e.target.value })} /></Field>
            <Field label="Storage" htmlFor={`v-storage-${i}`}><Input id={`v-storage-${i}`} value={v.storage} onChange={(e) => update(i, { storage: e.target.value })} /></Field>
            <Field label="Price" htmlFor={`v-price-${i}`}><Input id={`v-price-${i}`} type="number" min="0" required value={v.price} onChange={(e) => update(i, { price: e.target.value })} /></Field>
          </div>
          <div className="flex items-center gap-4">
            <Checkbox label="Active" checked={v.isActive} onChange={(e) => update(i, { isActive: e.target.checked })} />
            <Checkbox label="Default" checked={v.isDefault} onChange={(e) => update(i, { isDefault: e.target.checked })} />
            <button type="button" onClick={() => remove(i)} className="ml-auto text-red-500 hover:text-red-700 text-sm">Remove</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ImagesEditor({ images, onChange }: { images: ImageRow[]; onChange: (v: ImageRow[]) => void }) {
  const update = (i: number, patch: Partial<ImageRow>) => onChange(images.map((v, idx) => idx === i ? { ...v, ...patch } : v));
  const add = () => onChange([...images, { url: '', altText: '', isPrimary: images.length === 0, sortOrder: images.length }]);
  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-ink-900">Images</h4>
        <Button type="button" variant="outline" size="sm" onClick={add}><Plus size={14} className="mr-1" /> Add</Button>
      </div>
      {images.map((img, i) => (
        <div key={i} className="border border-ink-200 rounded-xl p-3 flex items-center gap-3">
          {img.url && <img src={img.url} alt="" className="w-12 h-12 rounded-lg object-cover bg-ink-50" />}
          <div className="flex-1 space-y-2">
            <Input placeholder="Image URL" value={img.url} onChange={(e) => update(i, { url: e.target.value })} />
            <Input placeholder="Alt text" value={img.altText} onChange={(e) => update(i, { altText: e.target.value })} />
          </div>
          <Checkbox label="Primary" checked={img.isPrimary} onChange={(e) => update(i, { isPrimary: e.target.checked })} />
          <button type="button" onClick={() => remove(i)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  );
}

function SpecsEditor({ specs, onChange }: { specs: SpecRow[]; onChange: (v: SpecRow[]) => void }) {
  const update = (i: number, patch: Partial<SpecRow>) => onChange(specs.map((v, idx) => idx === i ? { ...v, ...patch } : v));
  const add = () => onChange([...specs, { name: '', value: '', sortOrder: specs.length }]);
  const remove = (i: number) => onChange(specs.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-ink-900">Specifications</h4>
        <Button type="button" variant="outline" size="sm" onClick={add}><Plus size={14} className="mr-1" /> Add</Button>
      </div>
      {specs.map((s, i) => (
        <div key={i} className="flex items-center gap-3">
          <Input placeholder="Name" value={s.name} onChange={(e) => update(i, { name: e.target.value })} className="flex-1" />
          <Input placeholder="Value" value={s.value} onChange={(e) => update(i, { value: e.target.value })} className="flex-1" />
          <button type="button" onClick={() => remove(i)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  );
}
