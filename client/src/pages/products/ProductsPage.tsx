import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Frown } from 'lucide-react';
import { api } from '@/lib/api';
import { usePageMeta } from '@/lib/seo';
import { usePaginatedQuery, metaFromPaginated } from '@/lib/query';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import ProductGrid from '@/components/product/ProductGrid';
import { FilterSidebar, MobileFilters } from '@/components/product/FilterSidebar';
import SortDropdown from '@/components/product/SortDropdown';
import { Pagination } from '@/components/ui/Pagination';
import type { Category, ProductSummary } from '@/types';

const DEFAULT_SORT = 'featured';

export default function ProductsPage() {
  const { category } = useParams<{ category?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const q = searchParams.get('q') ?? '';
  const sort = searchParams.get('sort') ?? DEFAULT_SORT;
  const page = parseInt(searchParams.get('page') ?? '1', 10) || 1;
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const ratings = searchParams.get('ratings') ?? '';
  const availability = searchParams.get('availability') ?? '';
  const offers = searchParams.get('offers') === 'true';

  const filters = useMemo(
    () => ({ category: category ?? '', minPrice, maxPrice, ratings, availability }),
    [category, minPrice, maxPrice, ratings, availability],
  );

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return (res.data.data as Category[]) ?? [];
    },
  });

  const categories = categoriesQuery.data ?? [];
  const activeCategory = category ? categories.find((c) => c.slug === category) : undefined;

  const productsQuery = usePaginatedQuery<ProductSummary>(
    [
      'products-page',
      q,
      sort,
      category ?? '',
      minPrice,
      maxPrice,
      ratings,
      availability,
      offers ? 'offers' : 'all',
    ],
    async () => {
      const params: Record<string, string | number> = { page, limit: 24, sort };
      if (q) params.q = q;
      if (category) params.category = category;
      if (minPrice) params.minPrice = parseInt(minPrice, 10);
      if (maxPrice) params.maxPrice = parseInt(maxPrice, 10);
      if (ratings) params.ratings = parseInt(ratings, 10);
      if (availability) params.availability = availability;
      const res = await api.get('/products', {
        params: offers ? { sort: 'featured', page, limit: 24 } : params,
      });
      return { data: res.data.data as ProductSummary[], meta: metaFromPaginated(res.data.meta) };
    },
    page,
  );

  usePageMeta({
    title: activeCategory?.name ?? (q ? `Results for "${q}"` : 'Shop'),
    description: activeCategory?.description ?? 'Browse Nova Store devices and accessories.',
  });

  const setParam = (patch: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) next.delete(k);
      else next.set(k, v);
    });
    next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const handleSort = (value: string) => setParam({ sort: value });
  const handlePage = (p: number) => setParam({ page: String(p) });
  const clearFilters = () => {
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="container-nova py-8">
      {/* Breadcrumb / header */}
      <nav className="flex items-center gap-1 text-sm text-ink-500 mb-4" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-brand-600">Home</Link>
        <ChevronRight size={14} />
        <Link to="/products" className="hover:text-brand-600">Shop</Link>
        {category && (
          <>
            <ChevronRight size={14} />
            <span className="text-ink-900 font-medium">{activeCategory?.name ?? category}</span>
          </>
        )}
      </nav>

      <div className="mb-6">
        <h1 className="text-3xl font-medium text-ink-900">
          {activeCategory?.name ?? (q ? `Results for "${q}"` : 'All devices')}
        </h1>
        {activeCategory?.description && <p className="text-ink-500 mt-1">{activeCategory.description}</p>}
      </div>

      {offers && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-950 text-white px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="font-medium">Limited-time offers on Nova devices</span>
            <p className="text-sm text-white/80">Exclusive deals available for a short window.</p>
          </div>
          <Badge color="brand" className="bg-white/15 text-white">Deals</Badge>
        </div>
      )}

      <div className="flex lg:hidden items-center justify-between gap-3 mb-4">
        <Button variant="outline" onClick={() => setMobileFiltersOpen(true)}>
          Filters
        </Button>
        <SortDropdown value={sort} onChange={handleSort} />
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-24">
            <FilterSidebar
              categories={categories}
              filters={filters}
              sort={sort}
              onChange={setParam}
              onClear={clearFilters}
            />
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="hidden lg:flex items-center justify-end mb-4">
            <SortDropdown value={sort} onChange={handleSort} />
          </div>

          {productsQuery.isLoading ? (
            <ProductGridSkeleton />
          ) : productsQuery.isError ? (
            <ErrorState message="We couldn't load products." onRetry={() => productsQuery.refetch()} />
          ) : (productsQuery.data?.data.length ?? 0) === 0 ? (
            <EmptyState
              icon={<Frown size={48} />}
              title="No products found"
              description="Try adjusting your filters or search for something else."
              action={{ label: 'Clear filters', onClick: clearFilters }}
            />
          ) : (
            <>
              <p className="text-sm text-ink-500 mb-4">
                {productsQuery.data?.meta.total} product{(productsQuery.data?.meta.total ?? 0) === 1 ? '' : 's'}
              </p>
              <ProductGrid products={productsQuery.data!.data} />
              <div className="mt-8">
                <Pagination
                  page={page}
                  totalPages={productsQuery.data!.meta.totalPages}
                  onPageChange={handlePage}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <MobileFilters
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        categories={categories}
        filters={filters}
        sort={sort}
        onChange={setParam}
        onClear={clearFilters}
      />
    </div>
  );
}
