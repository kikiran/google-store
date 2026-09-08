import { ApiError } from '../utils/ApiError.js';

const ROLES = ['CUSTOMER', 'MANAGER', 'ADMIN'];

/**
 * Downstream services receive identity via trusted headers injected by the
 * API Gateway after it validates the JWT. This middleware enforces that.
 */

export function requireAuth(req, res, next) {
  const userId = req.headers['x-user-id'];
  const role = req.headers['x-user-role'];
  if (!userId) {
    return next(ApiError.unauthorized('UNAUTHENTICATED', 'Authentication required'));
  }
  req.user = {
    id: userId,
    email: req.headers['x-user-email'] || null,
    role: ROLES.includes(role) ? role : 'CUSTOMER',
    name: req.headers['x-user-name'] || null,
  };
  return next();
}

export function requireRole(...roles) {
  const allowed = new Set(roles);
  return (req, res, next) => {
    requireAuth(req, res, (authErr) => {
      if (authErr) return next(authErr);
      if (!allowed.has(req.user.role)) {
        return next(ApiError.forbidden('INSUFFICIENT_ROLE', `Requires one of roles: ${roles.join(', ')}`));
      }
      return next();
    });
  };
}

export function optionalAuth(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (userId) {
    req.user = {
      id: userId,
      email: req.headers['x-user-email'] || null,
      role: ['CUSTOMER', 'MANAGER', 'ADMIN'].includes(req.headers['x-user-role']) ? req.headers['x-user-role'] : 'CUSTOMER',
      name: req.headers['x-user-name'] || null,
    };
  }
  return next();
}

export function isAdmin() {
  return requireRole('ADMIN');
}

export function isStaff() {
  return requireRole('ADMIN', 'MANAGER');
}

export default { requireAuth, requireRole, optionalAuth, isAdmin, isStaff };