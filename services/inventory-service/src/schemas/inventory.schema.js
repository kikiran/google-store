import { z } from 'zod';

export const variantIdParams = z.object({
  params: z.object({ id: z.coerce.number().int().min(1) }),
});

export const summaryQuery = z.object({
  query: z.object({
    productId: z.coerce.number().int().min(1),
  }),
});

export const createReservationSchema = z.object({
  body: z.object({
    orderId: z.coerce.number().int().min(1),
    items: z.array(z.object({
      variantId: z.coerce.number().int().min(1),
      quantity: z.coerce.number().int().min(1),
    })).min(1),
  }),
});

export const releaseReservationSchema = z.object({
  body: z.object({
    orderId: z.coerce.number().int().min(1),
  }),
});

export const confirmReservationSchema = z.object({
  body: z.object({
    orderId: z.coerce.number().int().min(1),
  }),
});

export const adminInventoryQuery = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(48).default(24),
    q: z.string().optional(),
  }),
});

export const adminUpdateInventorySchema = z.object({
  params: z.object({ id: z.coerce.number().int().min(1) }),
  body: z.object({
    quantity: z.coerce.number().int().min(0).optional(),
    lowStockThreshold: z.coerce.number().int().min(0).optional(),
    delta: z.coerce.number().int().optional(),
  }),
});

export default {
  variantIdParams,
  summaryQuery,
  createReservationSchema,
  releaseReservationSchema,
  confirmReservationSchema,
  adminInventoryQuery,
  adminUpdateInventorySchema,
};
