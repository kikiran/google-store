import { z } from 'zod';

const address = z.object({
  fullName: z.string().trim().min(1).max(150).optional(),
  phone: z.string().trim().min(1).max(30).optional(),
  addressLine1: z.string().trim().min(1).max(255).optional(),
  addressLine2: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().min(1).max(100).optional(),
  state: z.string().trim().min(1).max(100).optional(),
  postalCode: z.string().trim().min(1).max(20).optional(),
  country: z.string().trim().min(1).max(100).optional(),
});

export const createShipmentSchema = z.object({
  body: z.object({
    orderId: z.coerce.number().int().positive(),
    methodCode: z.string().trim().min(1),
    recipientName: z.string().trim().min(1).max(150),
    recipientPhone: z.string().trim().min(1).max(30),
    address: address,
  }),
});

export const getShipmentByOrderSchema = z.object({
  params: z.object({ orderId: z.coerce.number().int().positive() }),
});

export const getShipmentByTrackingSchema = z.object({
  params: z.object({ trackingNumber: z.string().min(1) }),
});

export const addEventSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({
    status: z.enum(['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION']),
    location: z.string().trim().max(150).optional().nullable(),
    note: z.string().trim().max(300).optional().nullable(),
  }),
});

export default { createShipmentSchema, getShipmentByOrderSchema, getShipmentByTrackingSchema, addEventSchema };
