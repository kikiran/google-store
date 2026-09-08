import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { api } from '@/lib/api';
import { usePageMeta } from '@/lib/seo';
import { usePaginatedQuery, metaFromPaginated } from '@/lib/query';
import { Button } from '@/components/ui/Button';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import ProductGrid from '@/components/product/ProductGrid';
import { FilterSidebar, MobileFilters } from '@/components/product/FilterSidebar';
import SortDropdown from '@/components/product/SortDropdown';
import SearchBar from '@/components/search/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import type { Category, ProductSummary } from '@/types';

const POPULAR = ['Phones', 'Watches', 'Earbuds', 'Tablets'];

const DEFAULT_SORT = 'featured';

function sessionParam(): string | undefined {
  return localStorage.getItem('nova_guest_session') ?? undefined;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const q = searchParams.get('q') ?? '';
  const sort = searchParams.get('sort') ?? DEFAULT_SORT;
  const page = parseInt(searchParams.get('page') ?? '1', 10) || 1;
  const category = searchParams.get('category') ?? '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const ratings = searchParams.get('ratings') ?? '';
  const availability = searchParams.get('availability') ?? '';

  const filters = useMemo(
    () => ({ category, minPrice, maxPrice, ratings, availability }),
    [category, minPrice, maxPrice, ratings, availability],
  );

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return (res.data.data as Category[]) ?? [];
    },
  });

  const recentQuery = useQuery({
    queryKey: ['search-recent'],
    queryFn: async () => {
      const params: Record<string, string> = {};
      const session = sessionParam();
      if (session) params.session = session;
      const res = await api.get('/search/recent', { params });
      return (res.data.data as string[]) ?? [];
    },
  });

  const recordMutation = useMutation({
    mutationFn: (query: string) => api.post('/search/recent', { q: query, ...(sessionParam() ? { session: sessionParam() } : {}) }),
  });

  useEffect(() => {
    if (q) recordMutation.mutate(q);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const resultsQuery = usePaginatedQuery<ProductSummary>(
    ['search', q, sort, category, minPrice, maxPrice, ratings, availability],
    async () => {
      const params: Record<string, string | number> = { q, sort, page, limit: 24 };
      if (category) params.category = category;
      if (minPrice) params.minPrice = parseInt(minPrice, 10);
      if (maxPrice) params.maxPrice = parseInt(maxPrice, 10);
      if (ratings) params.ratings = parseInt(ratings, 10);
      if (availability) params.availability = availability;
      const res = await api.get('/search', { params });
      return { data: res.data.data as ProductSummary[], meta: metaFromPaginated(res.data.meta) };
    },
    page,
    { enabled: !!q },
  );

  usePageMeta({ title: q ? `Search: ${q}` : 'Search' });

  const setParam = (patch: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) next.delete(k);
      else next.set(k, v);
    });
    next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => setSearchParams({ q }, { replace: true });

  if (!q) {
    return (
      <div className="container-nova py-16 text-center">
        <div className="max-w-lg mx-auto">
          <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Search size={28} />
          </div>
          <h1 className="text-2xl font-medium text-ink-900 mb-1">Search Nova Store</h1>
          <p className="text-ink-500 mb-6">Find the device that's right for you.</p>
          <SearchBar autoFocus size="md" />
          <div className="mt-8">
            <p className="text-sm text-ink-500 mb-3">Popular searches</p>
            <div className="flex flex-wrap justify-center gap-2">
              {POPULAR.map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
                  className="px-4 py-1.5 bg-ink-50 rounded-full text-sm text-ink-700 hover:bg-ink-100"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-nova py-8">
      {/* Search bar + recent */}
      <div className="max-w-2xl mx-auto mb-8">
        <SearchBar size="md" autoFocus />
        {recentQuery.data && recentQuery.data.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 justify-center">
            <span className="text-sm text-ink-500">Recent:</span>
            {recentQuery.data.slice(0, 5).map((term) => (
              <button
                key={term}
                onClick={() => navigate(`/search?q=${encodeURIComponent(term)}`)}
                className="px-3 py-1 bg-ink-50 rounded-full text-sm text-ink-700 hover:bg-ink-100"
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </div>

      <h1 className="text-2xl font-medium text-ink-900 mb-4">
        Results for “{q}”
      </h1>

      <div className="flex lg:hidden items-center justify-between gap-3 mb-4">
        <Button variant="outline" onClick={() => setMobileOpen(true)}>Filters</Button>
        <SortDropdown value={sort} onChange={(v) => setParam({ sort: v })} />
      </div>

      <div className="flex gap-8">
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-24">
            <FilterSidebar
              categories={categoriesQuery.data ?? []}
              filters={filters}
              sort={sort}
              onChange={setParam}
              onClear={clearFilters}
            />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="hidden lg:flex items-center justify-end mb-4">
            <SortDropdown value={sort} onChange={(v) => setParam({ sort: v })} />
          </div>

          {resultsQuery.isLoading ? (
            <ProductGridSkeleton />
          ) : resultsQuery.isError ? (
            <ErrorState message="We couldn't complete your search." onRetry={() => resultsQuery.refetch()} />
          ) : (resultsQuery.data?.data.length ?? 0) === 0 ? (
            <EmptyState
              icon={<Search size={48} />}
              title="No results found"
              description={`We couldn't find anything for “${q}”. Try different keywords or clear your filters.`}
              action={{ label: 'Clear filters', onClick: clearFilters }}
            />
          ) : (
            <>
              <p className="text-sm text-ink-500 mb-4">About {resultsQuery.data?.meta.total} results</p>
              <ProductGrid products={resultsQuery.data!.data} />
              <div className="mt-8">
                <Pagination
                  page={page}
                  totalPages={resultsQuery.data!.meta.totalPages}
                  onPageChange={(p) => setParam({ page: String(p) })}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <MobileFilters
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        categories={categoriesQuery.data ?? []}
        filters={filters}
        sort={sort}
        onChange={setParam}
        onClear={clearFilters}
      />
    </div>
  );
}
