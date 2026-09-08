import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, handleApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { usePageMeta } from '@/lib/seo';
import { Button } from '@/components/ui/Button';
import { Input, Field, Select, Checkbox } from '@/components/ui/FormFields';
import { Spinner } from '@/components/ui/Spinner';
import { CheckCircle } from 'lucide-react';

interface ProfileData {
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string;
  bio: string;
  newsletterOptIn: boolean;
  preferredLanguage: string;
}

export default function ProfilePage() {
  usePageMeta({ title: 'Profile' });
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data.data.user;
    },
  });

  const [form, setForm] = useState<ProfileData | null>(null);

  const active = form ?? profile ?? null;

  const mutation = useMutation({
    mutationFn: (payload: Partial<ProfileData>) => api.patch('/users/me', payload),
    onSuccess: async () => {
      toast('Profile updated', { type: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      await refreshProfile();
    },
    onError: (err: unknown) => toast(handleApiError(err), { type: 'error' }),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!active) return;
    mutation.mutate({
      firstName: active.firstName,
      lastName: active.lastName,
      phone: active.phone,
      avatarUrl: active.avatarUrl,
      bio: active.bio,
      newsletterOptIn: active.newsletterOptIn,
      preferredLanguage: active.preferredLanguage,
    });
  };

  const set = (key: keyof ProfileData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...(f ?? profile!), [key]: e.target.value }));
  };

  const setCheck = (key: keyof ProfileData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...(f ?? profile!), [key]: e.target.checked }));
  };

  if (isLoading) return <div className="py-12 flex justify-center"><Spinner /></div>;
  if (!active) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-900">Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
        <div className="flex items-center gap-3 p-3 bg-ink-50 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-ink-900">{user?.email}</p>
            {user?.emailVerified && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle size={12} /> Verified</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" htmlFor="firstName">
            <Input id="firstName" required value={active.firstName} onChange={set('firstName')} />
          </Field>
          <Field label="Last name" htmlFor="lastName">
            <Input id="lastName" required value={active.lastName} onChange={set('lastName')} />
          </Field>
        </div>

        <Field label="Phone" htmlFor="phone">
          <Input id="phone" type="tel" value={active.phone || ''} onChange={set('phone')} />
        </Field>

        <Field label="Avatar URL" htmlFor="avatarUrl">
          <Input id="avatarUrl" value={active.avatarUrl || ''} onChange={set('avatarUrl')} />
        </Field>

        <Field label="Preferred language" htmlFor="lang">
          <Select id="lang" value={active.preferredLanguage || 'en'} onChange={set('preferredLanguage')}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </Select>
        </Field>

        <Checkbox label="Subscribe to newsletter" checked={active.newsletterOptIn} onChange={setCheck('newsletterOptIn')} />

        <Button type="submit" loading={mutation.isPending}>Save changes</Button>
      </form>
    </div>
  );
}
