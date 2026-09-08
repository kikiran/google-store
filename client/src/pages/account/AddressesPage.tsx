import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, handleApiError } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { usePageMeta } from '@/lib/seo';
import { Button } from '@/components/ui/Button';
import { Input, Field, Checkbox } from '@/components/ui/FormFields';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { MapPin, Pencil, Trash2, Star } from 'lucide-react';
import type { Address } from '@/types';

interface AddressForm {
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const emptyForm: AddressForm = { label: '', fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'India', isDefault: false };

export default function AddressesPage() {
  usePageMeta({ title: 'Addresses' });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: addresses, isLoading, error, refetch } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await api.get('/users/me/addresses');
      return res.data.data.addresses;
    },
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (addr: Address) => {
    setEditing(addr);
    setForm({ label: addr.label || '', fullName: addr.fullName, phone: addr.phone, addressLine1: addr.addressLine1, addressLine2: addr.addressLine2 || '', city: addr.city, state: addr.state, postalCode: addr.postalCode, country: addr.country, isDefault: addr.isDefault || false });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (payload: AddressForm) => {
      const body = { ...payload, addressLine2: payload.addressLine2 || undefined, label: payload.label || undefined };
      if (editing?.id) return api.put(`/users/me/addresses/${editing.id}`, body);
      return api.post('/users/me/addresses', body);
    },
    onSuccess: async () => {
      toast(editing ? 'Address updated' : 'Address added', { type: 'success' });
      setModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: (err: unknown) => toast(handleApiError(err), { type: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/users/me/addresses/${id}`),
    onSuccess: async () => {
      toast('Address deleted', { type: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: (err: unknown) => toast(handleApiError(err), { type: 'error' }),
  });

  const defaultMutation = useMutation({
    mutationFn: (id: number) => api.put(`/users/me/addresses/${id}/default`),
    onSuccess: async () => {
      toast('Default address set', { type: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: (err: unknown) => toast(handleApiError(err), { type: 'error' }),
  });

  const set = (key: keyof AddressForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  if (isLoading) return <div className="py-12 flex justify-center"><Spinner /></div>;
  if (error) return <ErrorState message="Failed to load addresses" onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">Addresses</h1>
        <Button onClick={openAdd}>Add address</Button>
      </div>

      {(!addresses || addresses.length === 0) ? (
        <EmptyState
          icon={<MapPin size={48} />}
          title="No addresses saved"
          description="Add a shipping address for faster checkout."
          action={{ label: 'Add address', onClick: openAdd }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className={`rounded-2xl border p-5 ${addr.isDefault ? 'border-brand-300 bg-brand-50/30' : 'border-ink-200'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  {addr.label && <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-ink-100 text-ink-600 mb-2">{addr.label}</span>}
                  {addr.isDefault && <span className="inline-flex items-center gap-1 text-xs text-brand-600 ml-2"><Star size={12} className="fill-brand-400" /> Default</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(addr)} className="p-1.5 rounded-full hover:bg-ink-100 text-ink-500"><Pencil size={14} /></button>
                  <button onClick={() => addr.id !== undefined && deleteMutation.mutate(addr.id)} className="p-1.5 rounded-full hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="text-sm text-ink-700 space-y-0.5">
                <p className="font-medium text-ink-900">{addr.fullName}</p>
                <p>{addr.addressLine1}</p>
                {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                <p>{addr.country}</p>
                {addr.phone && <p className="text-ink-500">{addr.phone}</p>}
              </div>
              {!addr.isDefault && addr.id !== undefined && (
                <button onClick={() => addr.id !== undefined && defaultMutation.mutate(addr.id)} className="mt-3 text-xs text-brand-600 hover:text-brand-700 font-medium">
                  Set as default
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit address' : 'Add address'} size="md">
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
          <Field label="Label (e.g. Home, Office)" htmlFor="label">
            <Input id="label" value={form.label} onChange={set('label')} placeholder="Optional" />
          </Field>
          <Field label="Full name" htmlFor="fullName">
            <Input id="fullName" required value={form.fullName} onChange={set('fullName')} />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <Input id="phone" type="tel" required value={form.phone} onChange={set('phone')} />
          </Field>
          <Field label="Address line 1" htmlFor="addressLine1">
            <Input id="addressLine1" required value={form.addressLine1} onChange={set('addressLine1')} />
          </Field>
          <Field label="Address line 2" htmlFor="addressLine2">
            <Input id="addressLine2" value={form.addressLine2} onChange={set('addressLine2')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="City" htmlFor="city">
              <Input id="city" required value={form.city} onChange={set('city')} />
            </Field>
            <Field label="State" htmlFor="state">
              <Input id="state" required value={form.state} onChange={set('state')} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Postal code" htmlFor="postalCode">
              <Input id="postalCode" required value={form.postalCode} onChange={set('postalCode')} />
            </Field>
            <Field label="Country" htmlFor="country">
              <Input id="country" required value={form.country} onChange={set('country')} />
            </Field>
          </div>
          <Checkbox label="Set as default" checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} />
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saveMutation.isPending}>{editing ? 'Update' : 'Add'} address</Button>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
