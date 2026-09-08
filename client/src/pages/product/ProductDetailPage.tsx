import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Check, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { handleApiError } from '@/lib/api';
import { usePageMeta } from '@/lib/seo';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { formatINR } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PriceDisplay } from '@/components/ui/Price';
import { RatingStars } from '@/components/ui/Rating';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton, TextBlockSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { ReviewList } from '@/components/review/ReviewList';
import ProductCarousel from '@/components/product/ProductCarousel';
import type { Product, Review, Vario } from '@/types';

interface SelectedVariant {
  variantId: number;
  color?: string;
  colorSwatch?: string;
  storage?: string;
  stock?: Vario['stock'];
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();

  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<SelectedVariant | null>(null);
  const [buying, setBuying] = useState(false);

  const query = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const res = await api.get(`/products/${slug}`);
      return res.data.data as Product;
    },
    enabled: !!slug,
  });

  const product = query.data;

  const reviewsQuery = useQuery({
    queryKey: ['reviews', product?.id],
    queryFn: async () => {
      const res = await api.get('/reviews', { params: { productId: product!.id, page: 1, limit: 50 } });
      return (res.data.data as Review[] ?? []);
    },
    enabled: !!product?.id,
  });

  usePageMeta({
    title: product ? `${product.name} — ${product.brand}` : 'Product',
    description: product?.tagline,
    canonical: product ? `/product/${product.slug}` : undefined,
    image: product?.images?.[0]?.url,
  });

  /* JSON-LD Product schema */
  useEffect(() => {
    if (!product) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'product-jsonld';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.name,
      description: product.tagline || product.description,
      brand: { '@type': 'Brand', name: product.brand },
      image: product.images?.[0]?.url,
      offers: {
        '@type': 'Offer',
        price: product.basePrice,
        priceCurrency: 'INR',
        availability: product.stock?.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
      aggregateRating: product.rating?.count
        ? { '@type': 'AggregateRating', ratingValue: product.rating.average, reviewCount: product.rating.count }
        : undefined,
    });
    document.head.appendChild(script);
    return () => {
      document.getElementById('product-jsonld')?.remove();
    };
  }, [product]);

  /* Derive unique colors / storages */
  const variants = product?.variants ?? [];
  const colors = useMemo(() => {
    const seen = new Map<string, { color: string; colorSwatch: string }>();
    variants.forEach((v) => {
      if (!seen.has(v.color ?? 'default')) {
        seen.set(v.color ?? 'default', { color: v.color ?? 'Default', colorSwatch: v.colorSwatch ?? '#CED4DA' });
      }
    });
    return Array.from(seen.values());
  }, [variants]);

  const storages = useMemo(() => {
    const set = new Set<string>();
    variants.forEach((v) => {
      if (v.storage) set.add(v.storage);
    });
    return Array.from(set);
  }, [variants]);

  const images = product?.images ?? [];

  /* Select a variant that matches color+storage; fall back to first default/in-stock */
  useEffect(() => {
    if (!product || !variants.length) return;
    const select = (color?: string, storage?: string) => {
      const match = variants.find((v) => {
        const colorMatch = !color || (v.color ?? 'default') === color;
        const storageMatch = !storage || v.storage === storage;
        return colorMatch && storageMatch && v.stock?.inStock;
      });
      if (match) {
        setSelected({ variantId: match.id, color: match.color, colorSwatch: match.colorSwatch, storage: match.storage, stock: match.stock });
        return;
      }
      const firstDefault = variants.find((v) => v.isDefault) ?? variants[0];
      if (firstDefault) {
        setSelected({ variantId: firstDefault.id, color: firstDefault.color, colorSwatch: firstDefault.colorSwatch, storage: firstDefault.storage, stock: firstDefault.stock });
      }
    };
    const colorMatches = colors.map((c) => c.color);
    const initialColor = selected ? (colorMatches.includes(selected.color ?? 'default') ? selected.color : undefined) : colorMatches[0];
    select(initialColor, selected?.storage);
  }, [product, variants, colors, storages]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedVariant = selected ? variants.find((v) => v.id === selected.variantId) : undefined;
  const maxQty = Math.min(10, selectedVariant?.stock?.available ?? 1);
  const outOfStock = !selectedVariant?.stock?.inStock || (selectedVariant?.stock?.available ?? 0) <= 0;

  useEffect(() => {
    if (outOfStock) setQty(1);
    else if (qty > maxQty) setQty(maxQty);
  }, [outOfStock, maxQty, qty]);

  const activeImg = images[activeImage];
  const selectedColor = selected?.colorSwatch ? selected.colorSwatch : undefined;

  const discount =
    product?.compareAtPrice && product.compareAtPrice > product.basePrice
      ? {
          amount: product.compareAtPrice - product.basePrice,
          pct: Math.round(((product.compareAtPrice - product.basePrice) / product.compareAtPrice) * 100),
        }
      : null;

  const promo = product?.promotions?.[0];

  const selectCombo = (color?: string, storage?: string) => {
    const match = variants.find(
      (v) =>
        (!color || (v.color ?? 'default') === color) &&
        (!storage || v.storage === storage),
    );
    if (match) {
      setSelected({
        variantId: match.id,
        color: match.color,
        colorSwatch: match.colorSwatch,
        storage: match.storage,
        stock: match.stock,
      });
    } else if (selectedVariant) {
      setSelected({ ...selected, variantId: selectedVariant.id });
    }
  };

  const handleColorSelect = (color: string, colorSwatch: string) => {
    selectCombo(color, selected?.storage);
  };

  const handleStorageSelect = (storage: string) => {
    selectCombo(selected?.color, storage);
  };

  const handleAddToCart = () => {
    if (!selectedVariant || outOfStock) return;
    addItem(selectedVariant.id, qty);
    toast(`${product!.name} added to cart`, { type: 'success', title: 'Added to cart' });
  };

  const handleBuyNow = async () => {
    if (!selectedVariant || outOfStock) return;
    setBuying(true);
    try {
      addItem(selectedVariant.id, qty);
      await new Promise((r) => setTimeout(r, 500));
      navigate('/checkout');
    } finally {
      setBuying(false);
    }
  };

  if (query.isLoading) {
    return (
      <div className="container-nova py-8">
        <div className="grid lg:grid-cols-2 gap-10">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-9 w-3/4" />
            <TextBlockSkeleton />
            <Skeleton className="h-12 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (query.isError || !product) {
    return (
      <div className="container-nova py-16">
        <ErrorState
          title="Product not found"
          message={query.isError ? handleApiError(query.error) : undefined}
          onRetry={() => query.refetch()}
        />
      </div>
    );
  }

  const summaryDistribution = product.rating?.distribution ?? {};

  return (
    <div className="container-nova py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-ink-500 mb-6 flex-wrap" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-brand-600">Home</Link>
        <ChevronRight size={14} />
        <Link to={`/products/${product.category.slug}`} className="hover:text-brand-600">{product.category.name}</Link>
        <ChevronRight size={14} />
        <span className="text-ink-900 font-medium">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* GALLERY */}
        <div>
          <div
            className="relative rounded-3xl overflow-hidden bg-ink-50 aspect-square flex items-center justify-center transition-colors"
            style={selectedColor ? { backgroundColor: selectedColor + '22' } : undefined}
          >
            {activeImg ? (
              <img src={activeImg.url} alt={activeImg.alt || product.name} className="w-full h-full object-contain p-6" />
            ) : (
              <span className="text-ink-400">No image</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 mt-3 overflow-x-auto scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-ink-50 border-2 transition-colors ${
                    i === activeImage ? 'border-brand-600' : 'border-transparent hover:border-ink-300'
                  }`}
                >
                  <img src={img.url} alt={img.alt || product.name} className="w-full h-full object-contain p-1" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* DETAILS */}
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {product.badge && <Badge color={product.badge === 'New' ? 'brand' : 'success'}>{product.badge}</Badge>}
            <Link to={`/products/${product.category.slug}`} className="text-sm text-brand-600 hover:text-brand-700">
              {product.category.name}
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-ink-900">{product.name}</h1>
          <div className="mt-2">
            <RatingStars value={product.rating?.average ?? 0} count={product.rating?.count ?? 0} showValue />
          </div>
          {product.tagline && <p className="mt-3 text-ink-600">{product.tagline}</p>}

          <div className="mt-4">
            <PriceDisplay price={discount ? product.compareAtPrice! : product.basePrice} size="lg" />
            {discount && (
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="text-xl font-semibold text-ink-900">{formatINR(product.basePrice)}</span>
                <span className="text-sm text-accent-600 font-medium">
                  You save {formatINR(discount.amount)} ({discount.pct}%)
                </span>
              </div>
            )}
            {promo && (
              <div className="mt-2">
                <Badge color="warning">{promo.promoLabel || promo.name}</Badge>
              </div>
            )}
          </div>

          {/* VARIANT SELECTORS */}
          {colors.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-ink-700 mb-2">Colour</p>
              <div className="flex gap-3 items-center flex-wrap">
                {colors.map((c) => {
                  const isSel = (selected?.color ?? 'default') === c.color;
                  return (
                    <button
                      key={c.color}
                      onClick={() => handleColorSelect(c.color, c.colorSwatch)}
                      className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSel ? 'border-brand-600 scale-110' : 'border-ink-200 hover:border-ink-400'
                      }`}
                      style={{ backgroundColor: c.colorSwatch }}
                      title={c.color}
                      aria-label={c.color}
                    >
                      {isSel && <Check size={14} className="text-white drop-shadow" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {storages.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-medium text-ink-700 mb-2">Storage</p>
              <div className="flex gap-2 flex-wrap">
                {storages.map((s) => {
                  const isSel = selected?.storage === s;
                  return (
                    <button
                      key={s}
                      onClick={() => handleStorageSelect(s)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                        isSel ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-ink-300 text-ink-700 hover:border-ink-500'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STOCK / QUANTITY / CTA */}
          <div className="mt-6 space-y-4">
            {outOfStock ? (
              <p className="text-sm font-medium text-red-600">Out of stock</p>
            ) : (
              <p className="text-sm text-accent-700">
                In stock · {selectedVariant?.stock?.available ?? 0} available
              </p>
            )}

            <div className="flex items-center gap-4">
              <QuantityStepper value={qty} onChange={setQty} min={1} max={maxQty || 1} />
              {!outOfStock && <span className="text-sm text-ink-500">{formatINR((selectedVariant?.price ?? product.basePrice) * qty)}</span>}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={outOfStock}
                variant={outOfStock ? 'secondary' : 'primary'}
                fullWidth
                className="sm:flex-1"
              >
                Add to cart
              </Button>
              <Button
                onClick={handleBuyNow}
                disabled={outOfStock}
                loading={buying}
                variant="secondary"
                fullWidth
                className="sm:flex-1"
              >
                Buy now
              </Button>
            </div>

            <p className="flex items-center gap-1.5 text-xs text-ink-500">
              <ShieldCheck size={14} className="text-accent-600" /> 1-year warranty · Free returns within 7 days
            </p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="mt-12">
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'reviews', label: `Reviews (${product.rating?.count ?? 0})` },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />

        <div className="py-8">
          {activeTab === 'overview' && (
            <div className="max-w-3xl">
              <p className="text-ink-700 leading-relaxed">{product.description}</p>
              {product.specifications && product.specifications.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-ink-900 mb-4">Specifications</h3>
                  <div className="overflow-hidden rounded-2xl border border-ink-200">
                    {product.specifications.map((s, i) => (
                      <div
                        key={i}
                        className={`grid grid-cols-1 sm:grid-cols-2 py-3 px-4 text-sm ${i % 2 === 0 ? 'bg-ink-50' : 'bg-white'}`}
                      >
                        <span className="text-ink-500 font-medium">{s.name}</span>
                        <span className="text-ink-900 mt-0.5 sm:mt-0">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Summary panel */}
              <div className="lg:col-span-1">
                <div className="rounded-2xl border border-ink-200 p-6 lg:sticky lg:top-24">
                  <div className="text-center mb-4">
                    <div className="text-4xl font-semibold text-ink-900">
                      {product.rating?.average ? product.rating.average.toFixed(1) : '—'}
                    </div>
                    <div className="flex justify-center mt-1">
                      <RatingStars value={product.rating?.average ?? 0} size={16} />
                    </div>
                    <p className="text-sm text-ink-500 mt-1">{product.rating?.count ?? 0} reviews</p>
                  </div>
                  <div className="space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = summaryDistribution[star] ?? 0;
                      const total = product.rating?.count ?? 0;
                      const pct = total ? (count / total) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs text-ink-600">
                          <span className="w-3 shrink-0">{star}</span>
                          <div className="flex-1 h-2 rounded-full bg-ink-100 overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-6 text-right text-ink-400">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* List */}
              <div className="lg:col-span-2">
                <ReviewList reviews={reviewsQuery.data ?? []} loading={reviewsQuery.isLoading} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RELATED */}
      {product.related && product.related.length > 0 && (
        <div className="mt-12">
          <ProductCarousel title="Frequently bought together" items={product.related} viewAllHref="/products" />
        </div>
      )}
    </div>
  );
}
