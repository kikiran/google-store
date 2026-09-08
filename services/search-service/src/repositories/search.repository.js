import pool from '../db.js';

/**
 * Search products. Uses MATCH...AGAINST for queries >= 3 chars,
 * falls back to LIKE for shorter queries. Joins nova_inventory.inventory
 * and nova_review.reviews (cross-schema READS on same MySQL server).
 */
export async function search({ q, category, minPrice, maxPrice, sort, page, limit }) {
  const offset = (page - 1) * limit;
  const conditions = ["p.status = 'active'", 'p.deleted_at IS NULL'];
  const params = [];

  if (q) {
    if (q.length >= 3) {
      conditions.push('MATCH(p.name, p.tagline, p.description, p.brand) AGAINST (? IN NATURAL LANGUAGE MODE)');
      params.push(q);
    } else {
      conditions.push('(p.name LIKE ? OR p.tagline LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like);
    }
  }
  if (category) {
    conditions.push('c.slug = ?');
    params.push(category);
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
    LEFT JOIN (SELECT product_id, url, alt_text FROM product_images WHERE is_primary = 1) img ON img.product_id = p.id
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
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;
  const [rows] = await pool.execute(sql, [...params, limit, offset]);

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

export async function matchingProductNames(q, limit = 5) {
  if (!q) return [];
  const [rows] = await pool.execute(
    `SELECT name FROM products
     WHERE status = 'active' AND deleted_at IS NULL
       AND (name LIKE ? OR tagline LIKE ?)
     ORDER BY (name = ?) DESC, name ASC
     LIMIT ?`,
    [`%${q}%`, `%${q}%`, q, limit]
  );
  return rows.map((r) => r.name);
}

export default { search, matchingProductNames };
