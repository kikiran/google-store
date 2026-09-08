import { z } from 'zod';

export const listOrdersQuery = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    status: z.string().optional(),
    q: z.string().optional(),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
    note: z.string().trim().max(300).optional().nullable(),
  }),
});

export default { listOrdersQuery, updateStatusSchema };
