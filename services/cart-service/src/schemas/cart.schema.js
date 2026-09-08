import { z } from 'zod';

export const addItemSchema = z.object({
  body: z.object({
    variantId: z.coerce.number().int().positive(),
    quantity: z.number().int().min(1).max(10).default(1),
  }),
});

export const updateItemSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({
    quantity: z.number().int().min(1).max(10),
  }),
});

export const removeItemSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

export const mergeSchema = z.object({
  body: z.object({
    guestSessionKey: z.string().min(1),
  }),
});

export default { addItemSchema, updateItemSchema, removeItemSchema, mergeSchema };
