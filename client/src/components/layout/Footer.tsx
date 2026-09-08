import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';

export default function Footer() {
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast('Thanks for subscribing!', { type: 'success' });
      setEmail('');
    }
  };

  return (
    <footer className="bg-ink-900 text-neutral-300 mt-auto">
      {/* Newsletter */}
      <div className="border-b border-ink-800">
        <div className="container-nova py-10">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-white text-lg font-medium mb-2">Stay in the loop</h3>
            <p className="text-sm text-ink-400 mb-4">Get the latest Nova news, deals, and product drops.</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="flex-1 rounded-full px-5 py-2.5 bg-ink-800 text-white border border-ink-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-ink-500"
              />
              <button type="submit" className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-sm font-medium transition-colors">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="container-nova py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <h4 className="text-white font-medium mb-4">About</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Store story</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Magazine</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Orders</h4>
            <ul className="space-y-2">
              <li><Link to="/products?offers=true" className="hover:text-white transition-colors">Offers</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Payment methods</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Shipping</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Returns</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Help</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Repairs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Return policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Sustainability</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Recycling</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-ink-800">
        <div className="container-nova py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-ink-500">
          <span>&copy; 2026 Nova Store Inc.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Sitemap</a>
          </div>
          <span>Made with care — Nova Store Inc.</span>
        </div>
      </div>
    </footer>
  );
}
