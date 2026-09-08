import pool from '../db.js';

export async function createRefreshToken({ userId, tokenHash, expiresAt, ip, userAgent }) {
  const [result] = await pool.execute(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, tokenHash, expiresAt, ip, userAgent]
  );
  return result.insertId;
}

export async function findRefreshTokenByHash(tokenHash) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, token_hash, expires_at, revoked_at, replaced_by
     FROM refresh_tokens WHERE token_hash = ? LIMIT 1`,
    [tokenHash]
  );
  return rows[0] || null;
}

export async function revokeRefreshToken(id) {
  await pool.execute('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?', [id]);
}

export async function markReplaced(id, newNodeHash) {
  await pool.execute('UPDATE refresh_tokens SET replaced_by = ? WHERE id = ?', [newNodeHash, id]);
}

export async function revokeAllForUser(userId) {
  await pool.execute('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL', [userId]);
}

export async function createPasswordResetToken({ userId, tokenHash, expiresAt }) {
  const [result] = await pool.execute(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
    [userId, tokenHash, expiresAt]
  );
  return result.insertId;
}

export async function findValidPasswordResetToken(tokenHash) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, token_hash FROM password_reset_tokens
     WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1`,
    [tokenHash]
  );
  return rows[0] || null;
}

export async function markPasswordResetTokenUsed(id) {
  await pool.execute('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?', [id]);
}

export async function createEmailVerificationToken({ userId, tokenHash, expiresAt }) {
  const [result] = await pool.execute(
    `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
    [userId, tokenHash, expiresAt]
  );
  return result.insertId;
}

export async function findValidVerificationToken(tokenHash) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, token_hash FROM email_verification_tokens
     WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1`,
    [tokenHash]
  );
  return rows[0] || null;
}

export async function markVerificationTokenUsed(id) {
  await pool.execute('UPDATE email_verification_tokens SET used_at = NOW() WHERE id = ?', [id]);
}

export default {
  createRefreshToken,
  findRefreshTokenByHash,
  revokeRefreshToken,
  markReplaced,
  revokeAllForUser,
  createPasswordResetToken,
  findValidPasswordResetToken,
  markPasswordResetTokenUsed,
  createEmailVerificationToken,
  findValidVerificationToken,
  markVerificationTokenUsed,
};