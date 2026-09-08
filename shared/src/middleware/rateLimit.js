import rateLimit from 'express-rate-limit';

/** Lightweight in-memory rate limiter. Use Redis for multi-instance in production. */
export function rateLimiter(options = {}) {
  return rateLimit({
    windowMs: options.windowMs || 60 * 1000,
    limit: options.limit || 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests, please slow down',
      },
    },
    ...options.tail,
  });
}

export const authRateLimiter = () =>
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 30,
  });

export default { rateLimiter, authRateLimiter };