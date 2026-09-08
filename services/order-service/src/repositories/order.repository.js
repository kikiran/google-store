import pool from '../db.js';

export async function insertOrder(data) {
  const [result] = await pool.execute(
    `INSERT INTO orders (
       order_number, user_id, customer_email, customer_name, status, shipping_method_code,
       shipping_method_name, items_subtotal, discount_total, shipping_total, tax_total,
       grand_total, currency, coupon_code, shipping_address, billing_address, notes, payment_status
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.order_number,
      data.user_id,
      data.customer_email,
      data.customer_name,
      data.status,
      data.shipping_method_code,
      data.shipping_method_name,
      data.items_subtotal,
      data.discount_total,
      data.shipping_total,
      data.tax_total,
      data.grand_total,
      data.currency,
      data.coupon_code,
      JSON.stringify(data.shipping_address),
      data.billing_address ? JSON.stringify(data.billing_address) : null,
      data.notes || null,
      data.payment_status,
    ]
  );
  return result.insertId;
}

export async function setOrderNumber(orderId, orderNumber) {
  await pool.execute(`UPDATE orders SET order_number = ? WHERE id = ?`, [orderNumber, orderId]);
}

export async function findById(conn, id) {
  const [rows] = await (conn || pool).execute(
    `SELECT * FROM orders WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function findByOrderNumber(conn, orderNumber) {
  const [rows] = await (conn || pool).execute(
    `SELECT * FROM orders WHERE order_number = ? LIMIT 1`,
    [orderNumber]
  );
  return rows[0] || null;
}

export async function updateOrderStatus(conn, orderId, status, paymentStatus) {
  await (conn || pool).execute(
    `UPDATE orders SET status = ?, payment_status = ?, updated_at = NOW() WHERE id = ?`,
    [status, paymentStatus || 'UNPAID', orderId]
  );
}

export async function updateOrderPaymentStatus(orderId, paymentStatus) {
  await pool.execute(`UPDATE orders SET payment_status = ?, updated_at = NOW() WHERE id = ?`, [paymentStatus, orderId]);
}

export async function insertOrderItem(conn, item, orderId) {
  await (conn || pool).execute(
    `INSERT INTO order_items (
       order_id, product_id, variant_id, product_name, variant_name, product_slug, sku,
       image_url, unit_price, compare_at_price, quantity, line_total
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orderId,
      item.product_id,
      item.variant_id,
      item.product_name,
      item.variant_name,
      item.product_slug,
      item.sku,
      item.image_url,
      item.unit_price,
      item.compare_at_price,
      item.quantity,
      item.line_total,
    ]
  );
}

export async function getOrderItems(orderId) {
  const [rows] = await pool.execute(
    `SELECT id, product_id, variant_id, product_name, variant_name, product_slug, sku,
            image_url, unit_price, compare_at_price, quantity, line_total
     FROM order_items WHERE order_id = ? ORDER BY id ASC`,
    [orderId]
  );
  return rows;
}

export async function insertStatusEvent(conn, orderId, fromStatus, toStatus, note, actorType, actorId) {
  await (conn || pool).execute(
    `INSERT INTO order_status_events (order_id, from_status, to_status, note, actor_type, actor_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [orderId, fromStatus || null, toStatus, note || null, actorType, actorId || null]
  );
}

export async function getStatusEvents(orderId) {
  const [rows] = await pool.execute(
    `SELECT id, from_status, to_status, note, actor_type, actor_id, created_at
     FROM order_status_events WHERE order_id = ? ORDER BY id ASC`,
    [orderId]
  );
  return rows;
}

export async function listByUser(userId, page, limit) {
  const offset = (page - 1) * limit;
  const [rows] = await pool.execute(
    `SELECT id, order_number, status, payment_status, items_subtotal, discount_total, shipping_total,
            tax_total, grand_total, currency, customer_email, customer_name, placed_at, created_at
     FROM orders
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  return rows;
}

export async function countByUser(userId) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM orders WHERE user_id = ?`,
    [userId]
  );
  return Number(rows[0]?.total || 0);
}

export async function listAdmin({ status, q, orderBy, orderDir, offset, limit }) {
  const conditions = [];
  const params = [];
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (q) {
    conditions.push('(customer_email LIKE ? OR customer_name LIKE ? OR order_number LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.execute(
    `SELECT id, order_number, status, payment_status, customer_email, customer_name, items_subtotal,
            discount_total, shipping_total, tax_total, grand_total, currency, placed_at, created_at
     FROM orders ${where}
     ORDER BY ${orderBy} ${orderDir}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return rows;
}

export async function countAdmin({ status, q }) {
  const conditions = [];
  const params = [];
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (q) {
    conditions.push('(customer_email LIKE ? OR customer_name LIKE ? OR order_number LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.execute(`SELECT COUNT(*) AS total FROM orders ${where}`, params);
  return Number(rows[0]?.total || 0);
}

export async function updateOrderNotes(id, note) {
  await pool.execute(`UPDATE orders SET notes = ?, updated_at = NOW() WHERE id = ?`, [note, id]);
}

export default {
  insertOrder,
  setOrderNumber,
  findById,
  findByOrderNumber,
  updateOrderStatus,
  updateOrderPaymentStatus,
  insertOrderItem,
  getOrderItems,
  insertStatusEvent,
  getStatusEvents,
  listByUser,
  countByUser,
  listAdmin,
  countAdmin,
  updateOrderNotes,
};
