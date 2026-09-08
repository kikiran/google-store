import pool from '../db.js';

export async function findActiveCartByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, session_key, status FROM carts
     WHERE user_id = ? AND status = 'active' LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

export async function findActiveCartBySessionKey(sessionKey) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, session_key, status FROM carts
     WHERE session_key = ? AND status = 'active' LIMIT 1`,
    [sessionKey]
  );
  return rows[0] || null;
}

export async function createCart({ userId = null, sessionKey = null }) {
  const [result] = await pool.execute(
    `INSERT INTO carts (user_id, session_key) VALUES (?, ?)`,
    [userId, sessionKey]
  );
  return { id: result.insertId, user_id: userId, session_key: sessionKey, status: 'active' };
}

export async function updateCartUserId(cartId, userId) {
  await pool.execute(`UPDATE carts SET user_id = ? WHERE id = ?`, [userId, cartId]);
}

export async function clearCart(cartId) {
  await pool.execute(`DELETE FROM cart_items WHERE cart_id = ?`, [cartId]);
}

export async function deleteCart(cartId) {
  await pool.execute(`UPDATE carts SET status = 'abandoned' WHERE id = ?`, [cartId]);
}

export async function findCartItemById(cartId, itemId) {
  const [rows] = await pool.execute(
    `SELECT id, cart_id, variant_id, quantity, unit_price, compare_at_price
     FROM cart_items WHERE id = ? AND cart_id = ? LIMIT 1`,
    [itemId, cartId]
  );
  return rows[0] || null;
}

export async function findCartItemByVariant(cartId, variantId) {
  const [rows] = await pool.execute(
    `SELECT id, cart_id, variant_id, quantity, unit_price, compare_at_price
     FROM cart_items WHERE cart_id = ? AND variant_id = ? LIMIT 1`,
    [cartId, variantId]
  );
  return rows[0] || null;
}

export async function getCartItems(cartId) {
  const [rows] = await pool.execute(
    `SELECT id, variant_id, quantity, unit_price, compare_at_price
     FROM cart_items WHERE cart_id = ? ORDER BY added_at ASC`,
    [cartId]
  );
  return rows;
}

export async function upsertCartItem(cartId, variantId, quantity, unitPrice, compareAtPrice) {
  const existing = await findCartItemByVariant(cartId, variantId);
  if (existing) {
    const newQty = Math.min(existing.quantity + quantity, 10);
    await pool.execute(
      `UPDATE cart_items SET quantity = ?, unit_price = ?, compare_at_price = ?, updated_at = NOW()
       WHERE id = ?`,
      [newQty, unitPrice, compareAtPrice, existing.id]
    );
    return { id: existing.id, quantity: newQty };
  }
  const [result] = await pool.execute(
    `INSERT INTO cart_items (cart_id, variant_id, quantity, unit_price, compare_at_price)
     VALUES (?, ?, ?, ?, ?)`,
    [cartId, variantId, quantity, unitPrice, compareAtPrice]
  );
  return { id: result.insertId, quantity };
}

export async function setCartItemQuantity(cartId, itemId, quantity) {
  await pool.execute(
    `UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ? AND cart_id = ?`,
    [quantity, itemId, cartId]
  );
}

export async function removeCartItem(cartId, itemId) {
  await pool.execute(`DELETE FROM cart_items WHERE id = ? AND cart_id = ?`, [itemId, cartId]);
}

export async function getCartItemCount(cartId) {
  const [rows] = await pool.execute(
    `SELECT COALESCE(SUM(quantity), 0) AS count FROM cart_items WHERE cart_id = ?`,
    [cartId]
  );
  return Number(rows[0]?.count || 0);
}

export default {
  findActiveCartByUserId,
  findActiveCartBySessionKey,
  createCart,
  updateCartUserId,
  clearCart,
  deleteCart,
  findCartItemById,
  findCartItemByVariant,
  getCartItems,
  upsertCartItem,
  setCartItemQuantity,
  removeCartItem,
  getCartItemCount,
};
