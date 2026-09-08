/**
 * Service registry — maps URL prefixes to internal service base URLs.
 * The gateway forwards requests to the owning (single) service per prefix.
 */
export const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  user: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003',
  inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3004',
  cart: process.env.CART_SERVICE_URL || 'http://localhost:3005',
  order: process.env.ORDER_SERVICE_URL || 'http://localhost:3006',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3007',
  shipping: process.env.SHIPPING_SERVICE_URL || 'http://localhost:3008',
  review: process.env.REVIEW_SERVICE_URL || 'http://localhost:3009',
  search: process.env.SEARCH_SERVICE_URL || 'http://localhost:3010',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3011',
};

/** /api/admin/<area>/* mapped to the owning service. */
export const ADMIN_AREA_MAP = {
  products: 'product',
  categories: 'product',
  promotions: 'product',
  users: 'user',
  orders: 'order',
  inventory: 'inventory',
  reviews: 'review',
  notifications: 'notification',
};

const AREA_SERVICE = {
  auth: 'auth',
  user: 'user',
  users: 'user',
  product: 'product',
  products: 'product',
  categories: 'category-target',
  promotions: 'product',
  inventory: 'inventory',
  cart: 'cart',
  orders: 'order',
  payments: 'payment',
  shipping: 'shipping',
  reviews: 'review',
  search: 'search',
  notifications: 'notification',
  health: 'gateway',
};

/** Resolve which service owns a given request URL path. */
export function resolveService(req) {
  const parts = req.path.split('/').filter(Boolean); // e.g. ['api','products','nova-x1-pro']
  if (parts.length === 0 || parts[0] !== 'api') return null;

  const area = parts[1];

  // Aggregate endpoints handled on the gateway itself.
  if (area === 'home' || area === 'health') return 'gateway';

  if (area === 'categories' && parts.length === 2) return 'product';
  if (area === 'categories') return 'product';

  if (area === 'admin') {
    const sub = parts[2];
    return ADMIN_AREA_MAP[sub] || null;
  }

  const service = AREA_SERVICE[area];
  if (service === 'category-target') return 'product';
  return service || null;
}

/** Product listing also aggregates inventory/review data downstream. */
export function buildTargetUrl(serviceName, originalUrl) {
  const base = SERVICES[serviceName];
  if (!base) return null;
  return `${base}${originalUrl}`;
}