import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, handleApiError } from '@/lib/api';
import { usePageMeta } from '@/lib/seo';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/FormFields';
import { MailCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  usePageMeta({ title: 'Forgot Password' });
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 text-green-600 mb-4">
            <MailCheck size={28} />
          </div>
          <h1 className="text-2xl font-bold text-ink-900 mb-2">Check your inbox</h1>
          <p className="text-sm text-ink-500 mb-6">
            If an account exists with <strong>{email}</strong>, we've sent a password reset link to your inbox.
          </p>
          <Link to="/login">
            <Button variant="outline" fullWidth>Back to sign in</Button>
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
          <h1 className="text-2xl font-bold text-ink-900">Forgot password?</h1>
          <p className="text-sm text-ink-500 mt-1">Enter your email and we'll send you a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>

          <Button type="submit" loading={loading} fullWidth>Send reset link</Button>
        </form>

        <p className="text-center text-sm text-ink-500 mt-6">
          <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
