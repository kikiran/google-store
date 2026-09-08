import pool from '../db.js';

const ADDRESS_COLUMNS = `id, user_id, label, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default, created_at, updated_at`;

const EXEC = pool;

export async function listByUserId(userId) {
  const [rows] = await EXEC.execute(
    `SELECT ${ADDRESS_COLUMNS} FROM user_addresses
     WHERE user_id = ? AND deleted_at IS NULL
     ORDER BY is_default DESC, id ASC`,
    [userId]
  );
  return rows;
}

export async function findByIdAndUser(id, userId, exec = EXEC) {
  const [rows] = await exec.execute(
    `SELECT ${ADDRESS_COLUMNS} FROM user_addresses
     WHERE id = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1`,
    [id, userId]
  );
  return rows[0] || null;
}

export async function countByUserId(userId, exec = EXEC) {
  const [rows] = await exec.execute(
    'SELECT COUNT(*) AS cnt FROM user_addresses WHERE user_id = ? AND deleted_at IS NULL',
    [userId]
  );
  return Number(rows[0].cnt);
}

export async function create(userId, data, exec = EXEC) {
  const [result] = await exec.execute(
    `INSERT INTO user_addresses (user_id, label, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      data.label,
      data.fullName,
      data.phone,
      data.addressLine1,
      data.addressLine2 || null,
      data.city,
      data.state,
      data.postalCode,
      data.country,
      data.isDefault ? 1 : 0,
    ]
  );
  return findByIdAndUser(result.insertId, userId, exec);
}

export async function update(id, userId, fields, exec = EXEC) {
  const set = [];
  const values = [];
  const mapping = {
    label: 'label',
    fullName: 'full_name',
    phone: 'phone',
    addressLine1: 'address_line1',
    addressLine2: 'address_line2',
    city: 'city',
    state: 'state',
    postalCode: 'postal_code',
    country: 'country',
    isDefault: 'is_default',
  };
  for (const [key, col] of Object.entries(mapping)) {
    if (fields[key] !== undefined) {
      set.push(`${col} = ?`);
      values.push(key === 'isDefault' ? (fields[key] ? 1 : 0) : fields[key]);
    }
  }
  if (set.length === 0) return findByIdAndUser(id, userId, exec);
  values.push(id, userId);
  await exec.execute(
    `UPDATE user_addresses SET ${set.join(', ')}
     WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
    values
  );
  return findByIdAndUser(id, userId, exec);
}

export async function softDelete(id, userId, exec = EXEC) {
  await exec.execute(
    'UPDATE user_addresses SET deleted_at = NOW() WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [id, userId]
  );
}

export async function unsetAllDefaults(userId, exec = EXEC) {
  await exec.execute(
    'UPDATE user_addresses SET is_default = 0 WHERE user_id = ? AND deleted_at IS NULL',
    [userId]
  );
}

export async function ensureOnlyDefault(userId, id, exec = EXEC) {
  await exec.execute(
    'UPDATE user_addresses SET is_default = 0 WHERE user_id = ? AND id <> ? AND deleted_at IS NULL',
    [userId, id]
  );
  await exec.execute(
    'UPDATE user_addresses SET is_default = 1 WHERE user_id = ? AND id = ?',
    [userId, id]
  );
}

export async function promoteNewDefault(userId, exec = EXEC) {
  await exec.execute(
    `UPDATE user_addresses SET is_default = 1
     WHERE user_id = ? AND deleted_at IS NULL AND is_default = 0
     ORDER BY id ASC LIMIT 1`,
    [userId]
  );
}

export default {
  listByUserId,
  findByIdAndUser,
  countByUserId,
  create,
  update,
  softDelete,
  unsetAllDefaults,
  ensureOnlyDefault,
  promoteNewDefault,
};