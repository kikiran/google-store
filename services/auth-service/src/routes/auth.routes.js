import { Router } from 'express';
import { middleware } from '@nova/shared';
import controller from '../controllers/auth.controller.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema } from '../schemas/auth.schema.js';

const router = Router();
const { validate, optionalAuth, requireAuth, authRateLimiter } = middleware;

router.post('/register', authRateLimiter(), validate(registerSchema), controller.register);
router.post('/login', authRateLimiter(), validate(loginSchema), controller.login);
router.post('/refresh', optionalAuth, controller.refresh);
router.post('/logout', optionalAuth, controller.logout);
router.post('/forgot-password', authRateLimiter(), validate(forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', authRateLimiter(), validate(resetPasswordSchema), controller.resetPassword);
router.get('/verify-email', validate(verifyEmailSchema), controller.verifyEmail);
router.get('/me', requireAuth, controller.me);

export default router;