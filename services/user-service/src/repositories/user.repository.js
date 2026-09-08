import pool from '../db.js';

export async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT id, email, first_name, last_name, phone, role, avatar_url, email_verified_at, is_active, created_at
     FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function findProfile(userId) {
  const [rows] = await pool.execute(
    `SELECT bio, newsletter_opt_in, preferred_language, currency
     FROM user_profiles WHERE user_id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

export async function upsertProfile(userId, fields) {
  const inserts = ['user_id'];
  const placeholders = ['?'];
  const values = [userId];
  const update = [];
  if (fields.bio !== undefined) {
    inserts.push('bio');
    placeholders.push('?');
    values.push(fields.bio || null);
    update.push('bio = VALUES(bio)');
  }
  if (fields.newsletterOptIn !== undefined) {
    inserts.push('newsletter_opt_in');
    placeholders.push('?');
    values.push(fields.newsletterOptIn ? 1 : 0);
    update.push('newsletter_opt_in = VALUES(newsletter_opt_in)');
  }
  if (fields.preferredLanguage !== undefined) {
    inserts.push('preferred_language');
    placeholders.push('?');
    values.push(fields.preferredLanguage);
    update.push('preferred_language = VALUES(preferred_language)');
  }
  const updateClause = update.length > 0 ? update.join(', ') : 'user_id = VALUES(user_id)';
  await pool.execute(
    `INSERT INTO user_profiles (${inserts.join(', ')}) VALUES (${placeholders.join(', ')})
     ON DUPLICATE KEY UPDATE ${updateClause}`,
    values
  );
  return findProfile(userId);
}

export async function updateUser(userId, fields) {
  const set = [];
  const values = [];
  if (fields.firstName !== undefined) {
    set.push('first_name = ?');
    values.push(fields.firstName);
  }
  if (fields.lastName !== undefined) {
    set.push('last_name = ?');
    values.push(fields.lastName);
  }
  if (fields.phone !== undefined) {
    set.push('phone = ?');
    values.push(fields.phone || null);
  }
  if (fields.avatarUrl !== undefined) {
    set.push('avatar_url = ?');
    values.push(fields.avatarUrl || null);
  }
  if (set.length === 0) return findById(userId);
  values.push(userId);
  await pool.execute(
    `UPDATE users SET ${set.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    values
  );
  return findById(userId);
}

export async function countAddresses(userId) {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS cnt FROM user_addresses WHERE user_id = ? AND deleted_at IS NULL',
    [userId]
  );
  return Number(rows[0].cnt);
}

export async function findPaged({ page, limit, q, role }) {
  const where = ['deleted_at IS NULL'];
  const values = [];
  if (q) {
    where.push('(email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)');
    const like = `%${q}%`;
    values.push(like, like, like);
  }
  if (role) {
    where.push('role = ?');
    values.push(role);
  }
  const [rows] = await pool.execute(
    `SELECT id, email, first_name, last_name, phone, role, avatar_url, email_verified_at, is_active, created_at, updated_at
     FROM users WHERE ${where.join(' AND ')} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...values, limit, (page - 1) * limit]
  );
  return rows;
}

export async function countPaged({ q, role }) {
  const where = ['deleted_at IS NULL'];
  const values = [];
  if (q) {
    where.push('(email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)');
    const like = `%${q}%`;
    values.push(like, like, like);
  }
  if (role) {
    where.push('role = ?');
    values.push(role);
  }
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS cnt FROM users WHERE ${where.join(' AND ')}`,
    values
  );
  return Number(rows[0].cnt);
}

export async function updateRole(id, role) {
  await pool.execute(
    'UPDATE users SET role = ? WHERE id = ? AND deleted_at IS NULL',
    [role, id]
  );
  return findById(id);
}

export async function updateStatus(id, isActive) {
  await pool.execute(
    'UPDATE users SET is_active = ? WHERE id = ? AND deleted_at IS NULL',
    [isActive ? 1 : 0, id]
  );
  return findById(id);
}

export async function softDelete(id) {
  await pool.execute('UPDATE users SET deleted_at = NOW() WHERE id = ?', [id]);
}

export default {
  findById,
  findProfile,
  upsertProfile,
  updateUser,
  countAddresses,
  findPaged,
  countPaged,
  updateRole,
  updateStatus,
  softDelete,
};