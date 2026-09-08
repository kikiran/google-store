import { z } from 'zod';

export const searchQuery = z.object({
  query: z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sort: z.enum(['featured', 'price_asc', 'price_desc', 'newest', 'rating', 'popular']).default('featured'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(48).default(24),
  }),
});

export const suggestionsQuery = z.object({
  query: z.object({
    q: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(20).default(8),
  }),
});

export const recentQuery = z.object({
  query: z.object({
    session: z.string().optional(),
  }),
});

export const recordRecentSchema = z.object({
  body: z.object({
    q: z.string().min(1).max(200),
  }),
});

export default { searchQuery, suggestionsQuery, recentQuery, recordRecentSchema };
