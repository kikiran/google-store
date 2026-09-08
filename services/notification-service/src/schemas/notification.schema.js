import { z } from 'zod';

export const sendNotificationSchema = z.object({
  body: z.object({
    type: z.string().trim().min(1).max(64),
    email: z.string().trim().email().max(255),
    name: z.string().trim().max(150).optional(),
    orderNumber: z.string().trim().max(24).optional(),
    summary: z.string().trim().max(500).optional(),
    total: z.string().trim().max(50).optional(),
    trackingNumber: z.string().trim().max(64).optional(),
    link: z.string().trim().max(500).optional(),
    userId: z.coerce.number().int().positive().optional(),
  }),
});

export const markReadSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

export const adminListNotificationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export default {
  sendNotificationSchema,
  markReadSchema,
  adminListNotificationsSchema,
};