import pool from '../db.js';

export async function findByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT id, email, password_hash, first_name, last_name, role, email_verified_at, is_active, avatar_url FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

export async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT id, email, first_name, last_name, phone, role, email_verified_at, is_active, avatar_url, created_at, last_login_at FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

export async function create({ email, passwordHash, firstName, lastName }) {
  const [result] = await pool.execute(
    `INSERT INTO users (email, password_hash, first_name, last_name)
     VALUES (?, ?, ?, ?)`,
    [email, passwordHash, firstName, lastName]
  );
  return findById(result.insertId);
}

export async function updateLastLogin(userId) {
  await pool.execute('UPDATE users SET last_login_at = NOW() WHERE id = ?', [userId]);
}

export async function updateEmailVerified(userId) {
  await pool.execute('UPDATE users SET email_verified_at = NOW() WHERE id = ?', [userId]);
}

export async function updatePassword(userId, passwordHash) {
  await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
}

export async function createProfile(userId, email) {
  await pool.execute(
    `INSERT INTO user_profiles (user_id, preferred_language, currency) VALUES (?, 'en', 'INR')
     ON DUPLICATE KEY UPDATE user_id = user_id`,
    [userId]
  );
  void email;
}

export default {
  findByEmail,
  findById,
  create,
  updateLastLogin,
  updateEmailVerified,
  updatePassword,
  createProfile,
};