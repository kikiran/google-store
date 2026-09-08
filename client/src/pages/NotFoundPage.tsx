import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { usePageMeta } from '@/lib/seo';

export default function NotFoundPage() {
  usePageMeta({ title: 'Page not found' });
  return (
    <div className="container-nova flex flex-col items-center justify-center py-24 text-center">
      <div className="text-7xl sm:text-8xl font-bold text-brand-600 mb-4">404</div>
      <h1 className="text-2xl font-medium text-ink-900 mb-2">Page not found</h1>
      <p className="text-ink-500 mb-6 max-w-sm">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/">
          <Button>
            <Home size={16} className="mr-2" />
            Back to home
          </Button>
        </Link>
        <Link to="/search">
          <Button variant="outline">
            <Search size={16} className="mr-2" />
            Search Nova Store
          </Button>
        </Link>
      </div>
    </div>
  );
}
