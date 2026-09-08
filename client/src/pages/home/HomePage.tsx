import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CreditCard,
  RefreshCw,
  Truck,
  Wallet,
  BadgePercent,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { usePageMeta } from '@/lib/seo';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/FormFields';
import ProductCarousel from '@/components/product/ProductCarousel';
import CategoryCard from '@/components/product/CategoryCard';
import type { ProductSummary, Category } from '@/types';

const heroBg =
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80';

const promo = [
  {
    title: 'Save more when you exchange',
    copy: 'Trade in your old device and get up to ₹12,000 off your new one.',
    image:
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80',
    cta: 'Explore offers',
    href: '/products?offers=true',
  },
  {
    title: 'Pay over time with no-cost EMI',
    copy: 'Split every purchase into easy monthly payments at 0% interest.',
    image:
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=900&q=80',
    cta: 'Learn more',
    href: '/products?offers=true',
  },
];

const benefits = [
  { icon: CreditCard, title: 'No-cost EMI', copy: 'Pay in easy monthly instalments with leading banks.' },
  { icon: RefreshCw, title: 'Exchange & save', copy: 'Trade in your old device and save big on upgrades.' },
  { icon: Truck, title: 'Free delivery', copy: 'Fast, free shipping on every order across India.' },
  { icon: Wallet, title: 'Store credit', copy: 'Earn credits on every purchase and referrals.' },
];

export default function HomePage() {
  usePageMeta({ title: 'Nova Store', description: 'Ask more of your phone. Discover premium Nova devices and accessories.' });
  const { toast } = useToast();
  const [email, setEmail] = useState('');

  const productsQuery = useQuery({
    queryKey: ['home-products'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { sort: 'featured', limit: 10 } });
      return res.data.data as ProductSummary[];
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ['home-categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return (res.data.data as Category[]) ?? [];
    },
  });

  const featured = productsQuery.data ?? [];
  const heroProduct = featured[0];
  const editorialOne = featured[1];
  const editorialTwo = featured[2];
  const categories = categoriesQuery.data ?? [];

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast('Thanks for subscribing!');
    setEmail('');
  };

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-ink-950 to-brand-950/70" />
        <div className="relative container-nova py-16 sm:py-24 lg:py-28 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="max-w-xl">
            <Badge color="brand" className="mb-5">
              <Sparkles size={12} className="mr-1" /> New · Nova 18 Pro
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium leading-tight tracking-tight">
              Ask more of your <span className="text-brand-300">phone.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-300 max-w-md">
              Meet the fastest, smartest Nova yet — built around your life with pro-grade
              cameras, all-day battery and intelligent on-device AI.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => (window.location.href = '/products')}>
                Browse devices <ArrowRight size={18} className="ml-2" />
              </Button>
              <Link to="/product/nova-18-pro">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Explore Nova 18 Pro
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative hidden lg:block">
            {productsQuery.isLoading && <Skeleton className="aspect-[4/5] w-full rounded-3xl" />}
            {heroProduct && (
              <img
                src={heroProduct.images?.[0].url}
                alt={heroProduct.name}
                loading="lazy"
                className="w-full aspect-[4/5] object-contain drop-shadow-2xl max-h-[520px] mx-auto"
              />
            )}
          </div>
        </div>
      </section>

      {/* POPULAR CAROUSEL */}
      <section className="container-nova py-14">
        {productsQuery.isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : productsQuery.isError ? (
          <ErrorState message="We couldn't load featured products." onRetry={() => productsQuery.refetch()} />
        ) : (
          <ProductCarousel
            title="Popular on Nova Store"
            subtitle="Loved by our community"
            items={featured}
            viewAllHref="/products"
          />
        )}
      </section>

      {/* PROMO SPLIT BAND */}
      <section className="container-nova pb-14">
        <div className="grid md:grid-cols-2 gap-6">
          {promo.map((p) => (
            <Link
              key={p.title}
              to={p.href}
              className="group relative rounded-3xl overflow-hidden aspect-[16/10] bg-ink-100 block"
            >
              <img src={p.image} alt={p.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-900/30 to-transparent" />
              <div className="relative p-7 sm:p-9 text-white flex flex-col justify-end h-full">
                <h3 className="text-2xl sm:text-3xl font-medium mb-2">{p.title}</h3>
                <p className="text-sm text-white/80 mb-4 max-w-sm">{p.copy}</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-300">
                  {p.cta} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-nova pb-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-medium text-ink-900">Shop popular categories</h2>
            <p className="text-sm text-ink-500 mt-1">Find exactly what you need, faster.</p>
          </div>
        </div>
        {categoriesQuery.isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton className="aspect-[4/3] rounded-3xl" key={i} />)}
          </div>
        ) : categoriesQuery.isError ? (
          <ErrorState message="We couldn't load categories." onRetry={() => categoriesQuery.refetch()} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((c) => <CategoryCard key={c.slug} category={c} />)}
          </div>
        )}
      </section>

      {/* EDITORIAL LATEST */}
      {(editorialOne || editorialTwo) && (
        <section className="container-nova pb-14">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-medium text-ink-900">Explore the latest</h2>
              <p className="text-sm text-ink-500 mt-1">New arrivals and standout devices</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[editorialOne, editorialTwo].filter(Boolean).map((p) => (
              <Link
                key={p!.slug}
                to={`/product/${p!.slug}`}
                className="group flex flex-col sm:flex-row items-center gap-4 rounded-3xl border border-ink-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-full sm:w-40 shrink-0 rounded-2xl bg-ink-50 aspect-square overflow-hidden flex items-center justify-center">
                  <img src={p!.images?.[0].url} alt={p!.name} loading="lazy" className="w-3/4 h-3/4 object-contain" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <span className="text-xs uppercase tracking-wide text-brand-600 font-medium">{p!.category.name}</span>
                  <h3 className="text-xl font-medium text-ink-900 mt-1">{p!.name}</h3>
                  <p className="text-sm text-ink-500 mt-1 line-clamp-2">{p!.tagline}</p>
                  <span className="inline-flex items-center gap-1 text-sm text-brand-600 font-medium mt-3">
                    Learn more <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* WHY BUY */}
      <section className="bg-ink-50 py-14">
        <div className="container-nova">
          <h2 className="text-center text-2xl font-medium text-ink-900 mb-8">Why buy on Nova Store</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="text-center">
                <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <b.icon size={22} />
                </div>
                <h3 className="font-medium text-ink-900 mb-1">{b.title}</h3>
                <p className="text-sm text-ink-500">{b.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="container-nova py-14">
        <div className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-950 text-white p-8 sm:p-12 text-center">
          <Badge color="brand" className="bg-white/15 text-white mb-4">
            <BadgePercent size={12} className="mr-1" /> Stay in the loop
          </Badge>
          <h2 className="text-3xl font-medium mb-3">Get the latest</h2>
          <p className="text-white/80 max-w-md mx-auto mb-6">
            Be first to hear about new Nova devices, exclusive offers and store events.
          </p>
          <form onSubmit={subscribe} className="flex gap-2 max-w-md mx-auto">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="bg-white/10 text-white placeholder:text-white/60 border-white/25 focus:bg-white/15"
            />
            <Button type="submit" className="bg-white text-brand-700 hover:bg-brand-50 shrink-0">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
