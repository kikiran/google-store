import { z } from 'zod';

const address = z.object({
  fullName: z.string().trim().min(1).max(150),
  phone: z.string().trim().min(1).max(30),
  addressLine1: z.string().trim().min(1).max(255),
  addressLine2: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(1).max(20),
  country: z.string().trim().min(1).max(100).default('India'),
});

const payment = z.object({
  method: z.enum(['card', 'upi', 'netbanking', 'wallet', 'mock']),
  card: z
    .object({
      number: z.string().min(1),
      expiry: z.string().min(1),
      cvv: z.string().min(1),
    })
    .optional(),
  upi: z.object({ vpa: z.string().min(1) }).optional(),
});

export const checkoutSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('A valid email address is required'),
    name: z.string().trim().min(1).max(150),
    shippingAddress: address,
    billingAddress: address.optional(),
    deliveryMethod: z.string().trim().min(1).default('standard'),
    couponCode: z.string().trim().optional().nullable(),
    items: z
      .array(
        z.object({
          variantId: z.coerce.number().int().positive(),
          quantity: z.number().int().min(1).max(99),
        })
      )
      .min(1, 'At least one item is required'),
    payment,
  }),
});

export const orderNumberParams = z.object({
  params: z.object({ orderNumber: z.string().min(1) }),
});

export const orderNumberEmailQuery = z.object({
  query: z.object({ email: z.string().trim().email().optional() }),
});

export const cancelSchema = orderNumberParams;

export const confirmPaymentSchema = orderNumberParams;

export default { checkoutSchema, orderNumberParams, orderNumberEmailQuery, cancelSchema, confirmPaymentSchema };
