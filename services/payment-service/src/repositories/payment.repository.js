import pool from '../db.js';

export async function createPayment({ paymentId, orderId, userId, amount, currency, method, provider }) {
  const [result] = await pool.execute(
    `INSERT INTO payments (payment_id, order_id, user_id, amount, currency, status, method, provider)
     VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?)`,
    [paymentId, orderId, userId || null, amount, currency, method, provider]
  );
  return result.insertId;
}

export async function findByPaymentId(paymentId) {
  const [rows] = await pool.execute(
    `SELECT id, payment_id, order_id, user_id, amount, currency, status, method, provider,
            provider_reference, metadata, created_at, updated_at
     FROM payments WHERE payment_id = ? LIMIT 1`,
    [paymentId]
  );
  return rows[0] || null;
}

export async function findByOrderId(orderId) {
  const [rows] = await pool.execute(
    `SELECT id, payment_id, order_id, user_id, amount, currency, status, method, provider,
            provider_reference, metadata, created_at, updated_at
     FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1`,
    [orderId]
  );
  return rows[0] || null;
}

export async function findConfirmedByOrderId(orderId) {
  const [rows] = await pool.execute(
    `SELECT id, payment_id, order_id, user_id, amount, currency, status, method, provider,
            provider_reference, metadata, created_at, updated_at
     FROM payments WHERE order_id = ? AND status = 'CONFIRMED' ORDER BY created_at DESC LIMIT 1`,
    [orderId]
  );
  return rows[0] || null;
}

export async function updatePaymentStatus(id, status, providerReference, metadata, provider) {
  await pool.execute(
    `UPDATE payments SET status = ?, provider_reference = ?, metadata = ?, provider = ?, updated_at = NOW()
     WHERE id = ?`,
    [status, providerReference || null, metadata ? JSON.stringify(metadata) : null, provider || 'mock', id]
  );
}

export async function updatePaymentMetadata(id, metadata) {
  await pool.execute(`UPDATE payments SET metadata = ?, updated_at = NOW() WHERE id = ?`, [JSON.stringify(metadata), id]);
}

export async function updatePaymentRefunded(id) {
  await pool.execute(`UPDATE payments SET status = 'REFUNDED', updated_at = NOW() WHERE id = ?`, [id]);
}

export default {
  createPayment,
  findByPaymentId,
  findByOrderId,
  findConfirmedByOrderId,
  updatePaymentStatus,
  updatePaymentMetadata,
  updatePaymentRefunded,
};
