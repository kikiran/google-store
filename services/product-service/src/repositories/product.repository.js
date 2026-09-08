import pool from '../db.js';
import { db } from '@nova/shared';

/**
 * List products (public). Joins nova_inventory.inventory for stock and
 * nova_review.reviews for rating — cross-schema READS on same MySQL server.
 */
export async function list({ page = 1, limit = 24, category, q, sort, minPrice, maxPrice, ratings, availability }) {
  const offset = (page - 1) * limit;
  const conditions = ["p.status = 'active'", 'p.deleted_at IS NULL'];
  const params = [];

  if (category) {
    conditions.push('c.slug = ?');
    params.push(category);
  }
  if (q) {
    conditions.push('(p.name LIKE ? OR p.tagline LIKE ? OR p.description LIKE ? OR p.brand LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  if (minPrice !== undefined) {
    conditions.push('p.base_price >= ?');
    params.push(minPrice);
  }
  if (maxPrice !== undefined) {
    conditions.push('p.base_price <= ?');
    params.push(maxPrice);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderBy = 'p.feature_rank ASC, p.created_at DESC';
  if (sort === 'price_asc') orderBy = 'p.base_price ASC';
  else if (sort === 'price_desc') orderBy = 'p.base_price DESC';
  else if (sort === 'newest') orderBy = 'p.created_at DESC';
  else if (sort === 'rating') orderBy = 'avg_rating DESC';
  else if (sort === 'popular') orderBy = 'review_count DESC';
  // featured is default: feature_rank ASC

  const havingParts = [];
  if (availability === 'in_stock') havingParts.push('stock_available > 0');
  else if (availability === 'out_of_stock') havingParts.push('stock_available <= 0');
  if (ratings) havingParts.push('avg_rating >= ?');
  const having = havingParts.length ? `HAVING ${havingParts.join(' AND ')}` : '';

  // Build the full query with subqueries for stock and reviews
  const sql = `
    SELECT p.id, p.slug, p.name, p.tagline, p.description, p.brand, p.badge,
           p.is_new AS isNew, p.is_featured AS isFeatured,
           c.id AS categoryId, c.slug AS categorySlug, c.name AS categoryName,
           p.base_price AS basePrice, p.compare_at_price AS compareAtPrice,
           COALESCE(img.url, '') AS imageUrl, COALESCE(img.alt_text, '') AS imageAlt,
           COALESCE(inv_agg.stock_available, 0) AS stockAvailable,
           COALESCE(inv_agg.stock_quantity, 0) AS stockQuantity,
           COALESCE(rev_agg.avg_rating, 0) AS avgRating,
           COALESCE(rev_agg.review_count, 0) AS reviewCount
    FROM products p
    INNER JOIN categories c ON c.id = p.category_id
    LEFT JOIN (
      SELECT product_id, url, alt_text
      FROM product_images WHERE is_primary = 1
    ) img ON img.product_id = p.id
    LEFT JOIN (
      SELECT pv.product_id, SUM(i.quantity - i.reserved_quantity) AS stock_available, SUM(i.quantity) AS stock_quantity
      FROM nova_inventory.inventory i
      INNER JOIN product_variants pv ON pv.id = i.variant_id
      GROUP BY pv.product_id
    ) inv_agg ON inv_agg.product_id = p.id
    LEFT JOIN (
      SELECT r.product_id, AVG(r.rating) AS avg_rating, COUNT(*) AS review_count
      FROM nova_review.reviews r
      WHERE r.status = 'APPROVED' AND r.deleted_at IS NULL
      GROUP BY r.product_id
    ) rev_agg ON rev_agg.product_id = p.id
    ${where}
    ${having}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;

  // If havingRating is used, append the param
  const allParams = ratings ? [...params, ratings, limit, offset] : [...params, limit, offset];
  const [rows] = await pool.execute(sql, allParams);

  // Count total
  const countSql = `
    SELECT COUNT(DISTINCT p.id) AS total
    FROM products p
    INNER JOIN categories c ON c.id = p.category_id
    ${where}
  `;
  const [countRows] = await pool.execute(countSql, params);
  const total = countRows[0]?.total || 0;

  return { rows, total };
}

/**
 * List products for admin — includes archived, with category name + variant count.
 * READS nova_inventory.inventory for stock.
 */
export async function adminList({ page = 1, limit = 24, q, status }) {
  const offset = (page - 1) * limit;
  const conditions = ['p.deleted_at IS NULL'];
  const params = [];

  if (status) {
    conditions.push('p.status = ?');
    params.push(status);
  }
  if (q) {
    conditions.push('(p.name LIKE ? OR p.slug LIKE ? OR p.brand LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT p.id, p.slug, p.name, p.brand, p.status, p.is_featured AS isFeatured,
           p.is_new AS isNew, p.base_price AS basePrice, p.feature_rank AS featureRank,
           p.created_at AS createdAt, p.updated_at AS updatedAt,
           c.name AS categoryName,
           (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id) AS variantCount
    FROM products p
    INNER JOIN categories c ON c.id = p.category_id
    ${where}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await pool.execute(sql, [...params, limit, offset]);

  const countSql = `SELECT COUNT(*) AS total FROM products p ${where}`;
  const [countRows] = await pool.execute(countSql, params);
  const total = countRows[0]?.total || 0;

  return { rows, total };
}

export async function findBySlug(slug) {
  const [rows] = await pool.execute(
    'SELECT * FROM products WHERE slug = ? AND deleted_at IS NULL LIMIT 1',
    [slug]
  );
  return rows[0] || null;
}

export async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT * FROM products WHERE id = ? AND deleted_at IS NULL LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

export async function findBySlugOrId(identifier) {
  const byId = Number(identifier);
  if (!Number.isNaN(byId) && String(byId) === String(identifier)) {
    return findById(byId);
  }
  return findBySlug(identifier);
}

export async function slugExists(slug, excludeId) {
  let sql = 'SELECT id FROM products WHERE slug = ? AND deleted_at IS NULL LIMIT 1';
  const params = [slug];
  if (excludeId) {
    sql = 'SELECT id FROM products WHERE slug = ? AND id != ? AND deleted_at IS NULL LIMIT 1';
    params.push(excludeId);
  }
  const [rows] = await pool.execute(sql, params);
  return rows.length > 0;
}

export async function create(data) {
  const [result] = await pool.execute(
    `INSERT INTO products (slug, name, tagline, description, brand, category_id, base_price, compare_at_price,
       badge, is_featured, is_new, status, feature_rank, meta_title, meta_description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.slug, data.name, data.tagline || null, data.description || null, data.brand || 'Nova',
      data.categoryId, data.basePrice, data.compareAtPrice || null,
      data.badge || null, data.isFeatured ? 1 : 0, data.isNew ? 1 : 0,
      data.status || 'draft', data.featureRank || 0, data.metaTitle || null, data.metaDescription || null,
    ]
  );
  return findById(result.insertId);
}

export async function update(id, fields) {
  const setClauses = [];
  const values = [];
  const mapping = {
    slug: 'slug', name: 'name', tagline: 'tagline', description: 'description',
    brand: 'brand', categoryId: 'category_id', basePrice: 'base_price',
    compareAtPrice: 'compare_at_price', badge: 'badge', isFeatured: 'is_featured',
    isNew: 'is_new', status: 'status', featureRank: 'feature_rank',
    metaTitle: 'meta_title', metaDescription: 'meta_description',
  };
  for (const [key, col] of Object.entries(mapping)) {
    if (fields[key] !== undefined) {
      setClauses.push(`${col} = ?`);
      if (key === 'isFeatured' || key === 'isNew') {
        values.push(fields[key] ? 1 : 0);
      } else {
        values.push(fields[key]);
      }
    }
  }
  if (setClauses.length === 0) return findById(id);
  values.push(id);
  await pool.execute(`UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

export async function softDelete(id) {
  await pool.execute(
    `UPDATE products SET deleted_at = NOW(), status = 'archived' WHERE id = ? AND deleted_at IS NULL`,
    [id]
  );
}

export async function findVariants(productId) {
  const [rows] = await pool.execute(
    'SELECT * FROM product_variants WHERE product_id = ? ORDER BY is_default DESC, id ASC',
    [productId]
  );
  return rows;
}

export async function findVariantById(variantId) {
  const [rows] = await pool.execute(
    'SELECT * FROM product_variants WHERE id = ? LIMIT 1',
    [variantId]
  );
  return rows[0] || null;
}

export async function findImages(productId) {
  const [rows] = await pool.execute(
    'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC',
    [productId]
  );
  return rows;
}

export async function findSpecifications(productId) {
  const [rows] = await pool.execute(
    'SELECT * FROM product_specifications WHERE product_id = ? ORDER BY sort_order ASC, id ASC',
    [productId]
  );
  return rows;
}

export async function findPromotions(productId) {
  const [rows] = await pool.execute(
    `SELECT pr.id, pr.name, pr.slug, pr.description, pr.discount_type, pr.discount_value,
            pr.starts_at, pr.ends_at, pr.is_active
     FROM promotions pr
     INNER JOIN product_promotions pp ON pp.promotion_id = pr.id
     WHERE pp.product_id = ? AND pr.is_active = 1
       AND pr.starts_at <= NOW() AND (pr.ends_at IS NULL OR pr.ends_at >= NOW())`,
    [productId]
  );
  return rows;
}

export async function findActivePromotions() {
  const [rows] = await pool.execute(
    `SELECT pr.id, pr.name, pr.slug, pr.description, pr.discount_type, pr.discount_value,
            pr.starts_at, pr.ends_at, pr.is_active
     FROM promotions pr
     WHERE pr.is_active = 1 AND pr.starts_at <= NOW() AND (pr.ends_at IS NULL OR pr.ends_at >= NOW())
     ORDER BY pr.starts_at DESC`
  );
  return rows;
}

export async function findPromotionProducts(promotionId) {
  const [rows] = await pool.execute(
    'SELECT product_id FROM product_promotions WHERE promotion_id = ?',
    [promotionId]
  );
  return rows.map((r) => r.product_id);
}

export async function findRelatedProducts(productId, categoryId, limit = 6) {
  const [rows] = await pool.execute(
    `SELECT p.id, p.slug, p.name, p.tagline, p.base_price AS basePrice, p.compare_at_price AS compareAtPrice,
            p.badge, p.is_new AS isNew,
            COALESCE(img.url, '') AS imageUrl
     FROM products p
     LEFT JOIN product_images img ON img.product_id = p.id AND img.is_primary = 1
     WHERE p.category_id = ? AND p.id != ? AND p.status = 'active' AND p.deleted_at IS NULL
     ORDER BY RAND()
     LIMIT ?`,
    [categoryId, productId, limit]
  );
  return rows;
}

export async function getRatingSummary(productId) {
  const [rows] = await pool.execute(
    `SELECT AVG(r.rating) AS average, COUNT(*) AS count
     FROM nova_review.reviews r
     WHERE r.product_id = ? AND r.status = 'APPROVED' AND r.deleted_at IS NULL`,
    [productId]
  );
  const summary = rows[0] || { average: 0, count: 0 };

  const [distRows] = await pool.execute(
    `SELECT r.rating, COUNT(*) AS count
     FROM nova_review.reviews r
     WHERE r.product_id = ? AND r.status = 'APPROVED' AND r.deleted_at IS NULL
     GROUP BY r.rating`,
    [productId]
  );
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of distRows) {
    distribution[row.rating] = row.count;
  }

  return {
    average: summary.average ? Number(Number(summary.average).toFixed(1)) : 0,
    count: summary.count,
    distribution,
  };
}

export async function getVariantStock(variantId) {
  const [rows] = await pool.execute(
    `SELECT quantity, reserved_quantity FROM nova_inventory.inventory WHERE variant_id = ? LIMIT 1`,
    [variantId]
  );
  if (!rows[0]) return { quantity: 0, reservedQuantity: 0, available: 0, inStock: false };
  const inv = rows[0];
  const available = inv.quantity - inv.reserved_quantity;
  return { quantity: inv.quantity, reservedQuantity: inv.reserved_quantity, available, inStock: available > 0 };
}

export async function createInventoryRow(variantId, quantity = 0) {
  await pool.execute(
    `INSERT INTO nova_inventory.inventory (variant_id, quantity, reserved_quantity, low_stock_threshold)
     VALUES (?, ?, 0, 5)
     ON DUPLICATE KEY UPDATE quantity = quantity`,
    [variantId, quantity]
  );
}

export default {
  list, adminList, findBySlug, findById, findBySlugOrId, slugExists, create, update, softDelete,
  findVariants, findVariantById, findImages, findSpecifications, findPromotions, findActivePromotions,
  findPromotionProducts, findRelatedProducts, getRatingSummary, getVariantStock, createInventoryRow,
};
