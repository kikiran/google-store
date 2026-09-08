import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('A valid email address is required');
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[0-9]/, 'Must contain a number');

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email,
    password,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email,
    password: z.string().min(1),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(10),
    password,
  }),
});

export const verifyEmailSchema = z.object({
  query: z.object({ token: z.string().min(10) }),
});

export default { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema };