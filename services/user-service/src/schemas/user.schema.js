import { z } from 'zod';

const updateMeBody = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(30).optional().nullable(),
  avatarUrl: z.string().trim().max(500).optional().nullable(),
  bio: z.string().trim().max(500).optional().nullable(),
  newsletterOptIn: z.boolean().optional(),
  preferredLanguage: z.string().trim().min(2).max(10).optional(),
});

export const updateMeSchema = z.object({
  body: updateMeBody.refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  }),
});

export const addressCreateSchema = z.object({
  body: z.object({
    label: z.string().trim().max(50).default('Home'),
    fullName: z.string().trim().min(1).max(150),
    phone: z.string().trim().min(1).max(30),
    addressLine1: z.string().trim().min(1).max(255),
    addressLine2: z.string().trim().max(255).optional().nullable(),
    city: z.string().trim().min(1).max(100),
    state: z.string().trim().min(1).max(100),
    postalCode: z.string().trim().min(1).max(20),
    country: z.string().trim().max(100).default('India'),
    isDefault: z.boolean().default(false),
  }),
});

export const addressUpdateSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({
    label: z.string().trim().max(50).optional(),
    fullName: z.string().trim().min(1).max(150).optional(),
    phone: z.string().trim().min(1).max(30).optional(),
    addressLine1: z.string().trim().min(1).max(255).optional(),
    addressLine2: z.string().trim().max(255).optional().nullable(),
    city: z.string().trim().min(1).max(100).optional(),
    state: z.string().trim().min(1).max(100).optional(),
    postalCode: z.string().trim().min(1).max(20).optional(),
    country: z.string().trim().max(100).optional(),
    isDefault: z.boolean().optional(),
  }),
});

export const addressIdParams = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

export const adminListUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    q: z.string().trim().optional(),
    role: z.enum(['CUSTOMER', 'MANAGER', 'ADMIN']).optional(),
  }),
});

export const updateUserRoleSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({
    role: z.enum(['CUSTOMER', 'MANAGER', 'ADMIN']),
  }),
});

export const updateUserStatusSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({
    isActive: z.boolean(),
  }),
});

export const deleteUserParams = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

export default {
  updateMeSchema,
  addressCreateSchema,
  addressUpdateSchema,
  addressIdParams,
  adminListUsersSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  deleteUserParams,
};