import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { handleApiError } from '@/lib/api';
import { usePageMeta } from '@/lib/seo';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/FormFields';

export default function LoginPage() {
  usePageMeta({ title: 'Sign In' });
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast('Welcome back!', { type: 'success' });
      navigate(from, { replace: true });
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 text-white font-bold text-lg mb-4">N</div>
          <h1 className="text-2xl font-bold text-ink-900">Welcome back</h1>
          <p className="text-sm text-ink-500 mt-1">Sign in to your Nova Store account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>

          <Field label="Password" htmlFor="password">
            <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-brand-600 hover:text-brand-700">Forgot password?</Link>
          </div>

          <Button type="submit" loading={loading} fullWidth>Sign in</Button>
        </form>

        <p className="text-center text-sm text-ink-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-600 hover:text-brand-700 font-medium">Create one</Link>
        </p>
      </div>
    </div>
  );
}
