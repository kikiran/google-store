import { useQuery, keepPreviousData } from '@tanstack/react-query';

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function metaFromPaginated(m: PaginatedMeta) {
  return m;
}

export function usePaginatedQuery<T>(
  key: string[],
  fetcher: () => Promise<{ data: T[]; meta: PaginatedMeta }>,
  page: number,
  opts?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...key, { page }],
    queryFn: fetcher,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
    enabled: opts?.enabled ?? true,
  });
}
