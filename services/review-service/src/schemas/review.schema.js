import { z } from 'zod';

export const listReviewsSchema = z.object({
  query: z.object({
    productId: z.coerce.number().int().positive(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(48).default(24),
  }),
});

export const reviewSummarySchema = z.object({
  query: z.object({
    productId: z.coerce.number().int().positive(),
  }),
});

export const createReviewSchema = z.object({
  body: z.object({
    productId: z.coerce.number().int().positive(),
    rating: z.coerce.number().int().min(1).max(5),
    title: z.string().trim().max(200).optional(),
    body: z.string().trim().min(10).max(5000),
  }),
});

export const helpfulParams = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

export const adminListReviewsSchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export const adminUpdateReviewSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    moderationNote: z.string().trim().max(500).optional(),
  }),
});

export default {
  listReviewsSchema,
  reviewSummarySchema,
  createReviewSchema,
  helpfulParams,
  adminListReviewsSchema,
  adminUpdateReviewSchema,
};