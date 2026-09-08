import pool from '../db.js';

const REVIEW_COLUMNS = `r.id, r.product_id, r.user_id, r.rating, r.title, r.body,
  r.is_verified_purchase, r.helpful_count, r.status, r.created_at, r.updated_at`;

export async function findApprovedPageable(productId, page, limit) {
  const [rows] = await pool.execute(
    `SELECT ${REVIEW_COLUMNS} FROM reviews r
     WHERE r.product_id = ? AND r.status = 'APPROVED' AND r.deleted_at IS NULL
     ORDER BY r.created_at DESC, r.id DESC
     LIMIT ? OFFSET ?`,
    [productId, limit, (page - 1) * limit]
  );
  return rows;
}

export async function countApproved(productId) {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS cnt FROM reviews WHERE product_id = ? AND status = \'APPROVED\' AND deleted_at IS NULL',
    [productId]
  );
  return Number(rows[0].cnt);
}

export async function findSummary(productId) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS cnt, COALESCE(AVG(rating), 0) AS average,
       SUM(rating = 1) AS r1, SUM(rating = 2) AS r2, SUM(rating = 3) AS r3,
       SUM(rating = 4) AS r4, SUM(rating = 5) AS r5
     FROM reviews
     WHERE product_id = ? AND status = 'APPROVED' AND deleted_at IS NULL`,
    [productId]
  );
  return rows[0];
}

export async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT ${REVIEW_COLUMNS} FROM reviews r WHERE r.id = ? AND r.deleted_at IS NULL LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function create({ productId, userId, rating, title, body, isVerifiedPurchase }) {
  const [result] = await pool.execute(
    `INSERT INTO reviews (product_id, user_id, rating, title, body, is_verified_purchase, status)
     VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
    [productId, userId, rating, title || null, body, isVerifiedPurchase ? 1 : 0]
  );
  return findById(result.insertId);
}

export async function findHelpful(reviewId, userId, exec = pool) {
  const [rows] = await exec.execute(
    'SELECT id FROM review_helpful WHERE review_id = ? AND user_id = ? LIMIT 1',
    [reviewId, userId]
  );
  return rows[0] || null;
}

export async function addHelpful(reviewId, userId, exec = pool) {
  await exec.execute(
    'INSERT INTO review_helpful (review_id, user_id) VALUES (?, ?)',
    [reviewId, userId]
  );
}

export async function removeHelpful(reviewId, userId, exec = pool) {
  await exec.execute(
    'DELETE FROM review_helpful WHERE review_id = ? AND user_id = ?',
    [reviewId, userId]
  );
}

export async function incrementHelpful(reviewId, exec = pool) {
  await exec.execute(
    'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?',
    [reviewId]
  );
}

export async function decrementHelpful(reviewId, exec = pool) {
  await exec.execute(
    'UPDATE reviews SET helpful_count = GREATEST(helpful_count - 1, 0) WHERE id = ?',
    [reviewId]
  );
}

export async function adminFindPageable(status, page, limit) {
  const [rows] = await pool.execute(
    `SELECT ${REVIEW_COLUMNS} FROM reviews r
     WHERE r.status = ? AND r.deleted_at IS NULL
     ORDER BY r.created_at DESC, r.id DESC
     LIMIT ? OFFSET ?`,
    [status, limit, (page - 1) * limit]
  );
  return rows;
}

export async function adminCount(status) {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS cnt FROM reviews WHERE status = ? AND deleted_at IS NULL',
    [status]
  );
  return Number(rows[0].cnt);
}

export async function adminUpdateStatus(id, status) {
  await pool.execute(
    'UPDATE reviews SET status = ? WHERE id = ? AND deleted_at IS NULL',
    [status, id]
  );
  return findById(id);
}

// CROSS-SCHEMA READ (nova_product.products): verify the reviewed product still exists.
export async function productExists(productId) {
  const [rows] = await pool.execute(
    'SELECT id FROM nova_product.products WHERE id = ? AND deleted_at IS NULL LIMIT 1',
    [productId]
  );
  return Boolean(rows[0]);
}

// CROSS-SCHEMA READ (nova_order.orders + nova_order.order_items): verified-purchase check.
export async function hasVerifiedPurchase(productId, userId) {
  const [rows] = await pool.execute(
    `SELECT 1 FROM nova_order.orders o
     JOIN nova_order.order_items oi ON oi.order_id = o.id
     WHERE oi.product_id = ? AND o.user_id = ? AND o.status IN ('DELIVERED', 'SHIPPED')
     LIMIT 1`,
    [productId, userId]
  );
  return Boolean(rows[0]);
}

// CROSS-SCHEMA READ (nova_user.users): resolve author display names.
export async function findUserNames(userIds) {
  if (userIds.length === 0) return new Map();
  const placeholders = userIds.map(() => '?').join(', ');
  const [rows] = await pool.execute(
    `SELECT id, first_name, last_name FROM nova_user.users WHERE id IN (${placeholders})`,
    userIds
  );
  return new Map(rows.map((r) => [String(r.id), `${r.first_name} ${r.last_name}`.trim()]));
}

export default {
  findApprovedPageable,
  countApproved,
  findSummary,
  findById,
  create,
  findHelpful,
  addHelpful,
  removeHelpful,
  incrementHelpful,
  decrementHelpful,
  adminFindPageable,
  adminCount,
  adminUpdateStatus,
  productExists,
  hasVerifiedPurchase,
  findUserNames,
};