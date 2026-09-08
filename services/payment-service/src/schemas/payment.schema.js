import { z } from 'zod';

export const chargeSchema = z.object({
  body: z.object({
    orderId: z.coerce.number().int().positive(),
    amount: z.coerce.number().positive(),
    currency: z.string().trim().length(3).default('INR'),
    method: z.enum(['card', 'upi', 'netbanking', 'wallet', 'mock']).default('mock'),
    card: z
      .object({
        number: z.string(),
        expiry: z.string().optional(),
        cvv: z.string().optional(),
      })
      .optional(),
    upi: z.object({ vpa: z.string().optional() }).optional(),
    userId: z.coerce.number().int().positive().optional().nullable(),
    email: z.string().email().optional().nullable(),
  }),
});

export const refundSchema = z.object({
  body: z.object({
    orderId: z.coerce.number().int().positive(),
    reason: z.string().trim().max(300).optional().default(''),
  }),
});

export const getByOrderSchema = z.object({
  params: z.object({ orderId: z.coerce.number().int().positive() }),
});

export default { chargeSchema, refundSchema, getByOrderSchema };
