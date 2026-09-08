import { logger } from '@nova/shared';
import searchRepository from '../repositories/search.repository.js';

// Static curated suggestions for prefix matching
const CURATED = [
  'iPhone', 'MacBook', 'iPad', 'AirPods', 'Samsung Galaxy', 'OnePlus', 'Pixel',
  'Laptop', 'Smartphone', 'Wireless Earbuds', 'Smart Watch', 'Camera', 'Headphones',
  'Charger', 'Accessories', 'Cases', 'Monitors', 'Keyboard', 'Mouse',
];

/**
 * In-memory recent queries store, keyed by caller identity (x-user-id header
 * or session query param). Ephemeral by design — swap for Redis in production.
 */
const recentQueries = new Map();
const MAX_PER_USER = 20;

function callerId(req) {
  return req.headers['x-user-id'] || req.query.session || 'anonymous';
}

function formatProduct(row) {
  return {
    id: String(row.id),
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    brand: row.brand,
    badge: row.badge,
    isNew: !!row.isNew,
    isFeatured: !!row.isFeatured,
    category: {
      id: String(row.categoryId),
      slug: row.categorySlug,
      name: row.categoryName,
    },
    basePrice: Number(row.basePrice),
    compareAtPrice: row.compareAtPrice ? Number(row.compareAtPrice) : null,
    images: row.imageUrl ? [{ url: row.imageUrl, alt: row.imageAlt || '' }] : [],
    rating: Number(row.avgRating) || 0,
    reviewCount: Number(row.reviewCount) || 0,
    stock: {
      available: Number(row.stockAvailable) || 0,
      quantity: Number(row.stockQuantity) || 0,
      inStock: (Number(row.stockAvailable) || 0) > 0,
    },
  };
}

export async function search(filters, req) {
  const { rows, total } = await searchRepository.search(filters);
  const products = rows.map(formatProduct);

  if (filters.q) {
    recordQuery(filters.q, req);
  }

  return {
    products,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function suggestions(q, limit, req) {
  if (!q) return [];
  const fromDb = await searchRepository.matchingProductNames(q, Math.min(5, limit));
  const fromCurated = CURATED.filter((s) => s.toLowerCase().startsWith(q.toLowerCase())).slice(0, Math.max(0, limit - fromDb.length));
  const combined = [...fromDb, ...fromCurated];
  return combined.slice(0, limit);
}

export function recordQuery(q, req) {
  if (!q) return;
  const id = callerId(req);
  const list = recentQueries.get(id) || [];
  const trimmed = q.trim();
  if (!trimmed) return;
  const filtered = list.filter((item) => item.q.toLowerCase() !== trimmed.toLowerCase());
  filtered.unshift({ q: trimmed, at: new Date().toISOString() });
  recentQueries.set(id, filtered.slice(0, MAX_PER_USER));
}

export function getRecent(req) {
  const id = callerId(req);
  const list = recentQueries.get(id) || [];
  return list.slice(0, MAX_PER_USER);
}

export default { search, suggestions, recordQuery, getRecent };
