import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePageMeta } from '@/lib/seo';
import { Package, User, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AccountPage() {
  usePageMeta({ title: 'My Account' });
  const { user } = useAuth();

  const quickLinks = [
    { to: '/account/orders', label: 'My Orders', icon: Package, desc: 'View and track your orders' },
    { to: '/account/profile', label: 'Profile', icon: User, desc: 'Update your personal info' },
    { to: '/account/addresses', label: 'Addresses', icon: MapPin, desc: 'Manage shipping addresses' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">
          Welcome, {user?.firstName}!
        </h1>
        <p className="text-sm text-ink-500 mt-1">Manage your account from here</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex flex-col items-start gap-3 p-5 rounded-2xl border border-ink-200 hover:shadow-md transition-shadow group"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <link.icon size={20} />
            </div>
            <div>
              <div className="text-sm font-medium text-ink-900 group-hover:text-brand-600 transition-colors">{link.label}</div>
              <div className="text-xs text-ink-500 mt-0.5">{link.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-ink-50 border border-ink-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-ink-900">Ready to shop?</h3>
            <p className="text-sm text-ink-500 mt-1">Browse our latest collection of devices &amp; accessories</p>
          </div>
          <Link to="/products">
            <Button>
              Shop now <ArrowRight size={16} className="ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
