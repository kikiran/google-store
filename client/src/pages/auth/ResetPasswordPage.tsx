import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, handleApiError } from '@/lib/api';
import { usePageMeta } from '@/lib/seo';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/FormFields';
import { CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  usePageMeta({ title: 'Reset Password' });
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-ink-900 mb-2">Invalid link</h1>
          <p className="text-sm text-ink-500 mb-6">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password">
            <Button fullWidth>Request a new link</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 text-green-600 mb-4">
            <CheckCircle size={28} />
          </div>
          <h1 className="text-2xl font-bold text-ink-900 mb-2">Password updated</h1>
          <p className="text-sm text-ink-500 mb-6">Your password has been reset successfully.</p>
          <Link to="/login">
            <Button fullWidth>Sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 text-white font-bold text-lg mb-4">N</div>
          <h1 className="text-2xl font-bold text-ink-900">Set new password</h1>
          <p className="text-sm text-ink-500 mt-1">Choose a strong password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <Field label="New password" htmlFor="password" hint="Min 8 characters">
            <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>

          <Field label="Confirm password" htmlFor="confirm">
            <Input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>

          <Button type="submit" loading={loading} fullWidth>Reset password</Button>
        </form>

        <p className="text-center text-sm text-ink-500 mt-6">
          <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
