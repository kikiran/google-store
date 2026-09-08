import pool from '../db.js';

export async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT * FROM promotions WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

export async function create({ name, slug, description, discountType, discountValue, startsAt, endsAt, isActive }) {
  const [result] = await pool.execute(
    `INSERT INTO promotions (name, slug, description, discount_type, discount_value, starts_at, ends_at, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, slug, description || null, discountType, discountValue, startsAt, endsAt || null, isActive ? 1 : 0]
  );
  return findById(result.insertId);
}

export async function update(id, fields) {
  const setClauses = [];
  const values = [];
  const mapping = {
    name: 'name', slug: 'slug', description: 'description', discountType: 'discount_type',
    discountValue: 'discount_value', startsAt: 'starts_at', endsAt: 'ends_at', isActive: 'is_active',
  };
  for (const [key, col] of Object.entries(mapping)) {
    if (fields[key] !== undefined) {
      setClauses.push(`${col} = ?`);
      if (key === 'isActive') {
        values.push(fields[key] ? 1 : 0);
      } else {
        values.push(fields[key]);
      }
    }
  }
  if (setClauses.length === 0) return findById(id);
  values.push(id);
  await pool.execute(`UPDATE promotions SET ${setClauses.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

export async function remove(id) {
  await pool.execute('DELETE FROM promotions WHERE id = ?', [id]);
}

export async function slugExists(slug, excludeId) {
  let sql = 'SELECT id FROM promotions WHERE slug = ? LIMIT 1';
  const params = [slug];
  if (excludeId) {
    sql = 'SELECT id FROM promotions WHERE slug = ? AND id != ? LIMIT 1';
    params.push(excludeId);
  }
  const [rows] = await pool.execute(sql, params);
  return rows.length > 0;
}

export async function replaceProducts(promotionId, productIds) {
  await pool.execute('DELETE FROM product_promotions WHERE promotion_id = ?', [promotionId]);
  if (productIds && productIds.length > 0) {
    const values = productIds.map((pid) => [pid, promotionId]);
    const placeholders = values.map(() => '(?, ?)').join(', ');
    const flat = values.flat();
    await pool.execute(
      `INSERT INTO product_promotions (product_id, promotion_id) VALUES ${placeholders}`,
      flat
    );
  }
}

export default { findById, create, update, remove, slugExists, replaceProducts };
