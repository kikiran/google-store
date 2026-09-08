import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { handleApiError } from '@/lib/api';
import { usePageMeta } from '@/lib/seo';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/FormFields';

export default function RegisterPage() {
  usePageMeta({ title: 'Create Account' });
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = 'Required';
    if (!form.lastName.trim()) errs.lastName = 'Required';
    if (!form.email.trim()) errs.email = 'Required';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Must include an uppercase letter';
    else if (!/[0-9]/.test(form.password)) errs.password = 'Must include a number';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setError('');
    setLoading(true);
    try {
      await register({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(), password: form.password });
      toast('Account created! Welcome to Nova.', { type: 'success' });
      navigate(from, { replace: true });
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 text-white font-bold text-lg mb-4">N</div>
          <h1 className="text-2xl font-bold text-ink-900">Create your account</h1>
          <p className="text-sm text-ink-500 mt-1">Join Nova Store today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="First name" htmlFor="firstName" error={errors.firstName}>
              <Input id="firstName" required value={form.firstName} onChange={set('firstName')} />
            </Field>
            <Field label="Last name" htmlFor="lastName" error={errors.lastName}>
              <Input id="lastName" required value={form.lastName} onChange={set('lastName')} />
            </Field>
          </div>

          <Field label="Email" htmlFor="email" error={errors.email}>
            <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
          </Field>

          <Field label="Password" htmlFor="password" error={errors.password} hint="Min 8 characters with uppercase & number">
            <Input id="password" type="password" autoComplete="new-password" required value={form.password} onChange={set('password')} />
          </Field>

          <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword}>
            <Input id="confirmPassword" type="password" autoComplete="new-password" required value={form.confirmPassword} onChange={set('confirmPassword')} />
          </Field>

          <Button type="submit" loading={loading} fullWidth>Create account</Button>
        </form>

        <p className="text-center text-sm text-ink-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
