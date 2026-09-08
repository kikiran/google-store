import pool from '../db.js';

export async function findByVariantId(variantId) {
  const [rows] = await pool.execute(
    'SELECT id, variant_id, quantity, reserved_quantity, low_stock_threshold, updated_at FROM inventory WHERE variant_id = ? LIMIT 1',
    [variantId]
  );
  return rows[0] || null;
}

export async function findByVariantIdForUpdate(conn, variantId) {
  const [rows] = await conn.execute(
    'SELECT id, variant_id, quantity, reserved_quantity, low_stock_threshold FROM inventory WHERE variant_id = ? FOR UPDATE',
    [variantId]
  );
  return rows[0] || null;
}

export async function findByVariantIds(variantIds) {
  if (!variantIds.length) return [];
  const placeholders = variantIds.map(() => '?').join(', ');
  const [rows] = await pool.execute(
    `SELECT id, variant_id, quantity, reserved_quantity, low_stock_threshold FROM inventory WHERE variant_id IN (${placeholders})`,
    variantIds
  );
  return rows;
}

export async function getSummaryByProductId(productId) {
  // Cross-read nova_product.product_variants to get variant info
  const [rows] = await pool.execute(
    `SELECT i.variant_id, i.quantity, i.reserved_quantity, i.low_stock_threshold,
            pv.name AS variantName, pv.sku, pv.color, pv.storage
     FROM inventory i
     INNER JOIN nova_product.product_variants pv ON pv.id = i.variant_id
     WHERE pv.product_id = ?`,
    [productId]
  );
  return rows;
}

/**
 * Admin list: joins nova_product.product_variants and nova_product.products
 * READ cross-schema on same MySQL server.
 */
export async function adminList({ page = 1, limit = 24, q }) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (q) {
    conditions.push('(pv.sku LIKE ? OR p.name LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT i.id, i.variant_id AS variantId, i.quantity, i.reserved_quantity AS reservedQuantity,
           i.low_stock_threshold AS lowStockThreshold, i.updated_at AS updatedAt,
           pv.sku, pv.name AS variantName, pv.color, pv.storage,
           p.id AS productId, p.name AS productName, p.slug AS productSlug,
           c.name AS categoryName
    FROM inventory i
    INNER JOIN nova_product.product_variants pv ON pv.id = i.variant_id
    INNER JOIN nova_product.products p ON p.id = pv.product_id
    INNER JOIN nova_product.categories c ON c.id = p.category_id
    ${where}
    ORDER BY i.updated_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await pool.execute(sql, [...params, limit, offset]);

  const countSql = `
    SELECT COUNT(*) AS total
    FROM inventory i
    INNER JOIN nova_product.product_variants pv ON pv.id = i.variant_id
    INNER JOIN nova_product.products p ON p.id = pv.product_id
    ${where}
  `;
  const [countRows] = await pool.execute(countSql, params);
  const total = countRows[0]?.total || 0;

  return { rows, total };
}

export async function adjustQuantity(variantId, delta, conn) {
  const executor = conn || pool;
  const [result] = await executor.execute(
    'UPDATE inventory SET quantity = quantity + ? WHERE variant_id = ? AND (quantity + ?) >= 0',
    [delta, variantId, delta]
  );
  return result.affectedRows > 0;
}

export async function setQuantity(variantId, quantity, conn) {
  const executor = conn || pool;
  await executor.execute(
    'UPDATE inventory SET quantity = ? WHERE variant_id = ?',
    [quantity, variantId]
  );
}

export async function setReservedQuantity(variantId, reservedQuantity, conn) {
  const executor = conn || pool;
  await executor.execute(
    'UPDATE inventory SET reserved_quantity = ? WHERE variant_id = ?',
    [reservedQuantity, variantId]
  );
}

export async function updateLowStockThreshold(variantId, threshold) {
  await pool.execute(
    'UPDATE inventory SET low_stock_threshold = ? WHERE variant_id = ?',
    [threshold, variantId]
  );
}

export async function createReservation({ reservationToken, orderId, variantId, quantity, expiresAt }) {
  const [result] = await pool.execute(
    `INSERT INTO stock_reservations (reservation_token, order_id, variant_id, quantity, status, expires_at)
     VALUES (?, ?, ?, ?, 'ACTIVE', ?)`,
    [reservationToken, orderId, variantId, quantity, expiresAt]
  );
  return result.insertId;
}

export async function findActiveReservationsByOrder(orderId) {
  const [rows] = await pool.execute(
    `SELECT id, reservation_token, order_id, variant_id, quantity, status, expires_at
     FROM stock_reservations WHERE order_id = ? AND status = 'ACTIVE'`,
    [orderId]
  );
  return rows;
}

export async function updateReservationStatus(orderId, status, conn) {
  const executor = conn || pool;
  await executor.execute(
    `UPDATE stock_reservations SET status = ?, released_at = NOW() WHERE order_id = ? AND status = 'ACTIVE'`,
    [status, orderId]
  );
}

export async function logMovement({ variantId, changeType, quantityChange, referenceType, referenceId, note, createdBy }) {
  await pool.execute(
    `INSERT INTO inventory_movements (variant_id, change_type, quantity_change, reference_type, reference_id, note, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [variantId, changeType, quantityChange, referenceType || null, referenceId ? String(referenceId) : null, note || null, createdBy || null]
  );
}

export default {
  findByVariantId, findByVariantIdForUpdate, findByVariantIds, getSummaryByProductId,
  adminList, adjustQuantity, setQuantity, setReservedQuantity, updateLowStockThreshold,
  createReservation, findActiveReservationsByOrder, updateReservationStatus, logMovement,
};
