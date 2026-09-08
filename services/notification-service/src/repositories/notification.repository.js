import pool from '../db.js';

export async function findTemplateByType(type) {
  const [rows] = await pool.execute(
    'SELECT id, type, channel, subject_template, body_template FROM notification_templates WHERE type = ? LIMIT 1',
    [type]
  );
  return rows[0] || null;
}

export async function insertNotification({ userId, email, channel, type, subject, body, payload, externalRef }) {
  const [result] = await pool.execute(
    `INSERT INTO notifications (user_id, email, channel, type, subject, body, payload, external_ref, read_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      userId || null,
      email || null,
      channel,
      type,
      subject,
      body,
      payload ? JSON.stringify(payload) : null,
      externalRef || null,
    ]
  );
  return result.insertId;
}

export async function insertEmailLog({ toEmail, fromEmail, subject, htmlBody, provider, status, error }) {
  const [result] = await pool.execute(
    `INSERT INTO email_logs (to_email, from_email, subject, html_body, provider, status, error)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [toEmail, fromEmail, subject, htmlBody || null, provider, status, error || null]
  );
  return result.insertId;
}

export async function listForUser({ userId, email }) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, email, channel, type, subject, body, external_ref, read_at, created_at
     FROM notifications
     WHERE user_id = ? OR (email = ? AND email IS NOT NULL)
     ORDER BY created_at DESC, id DESC
     LIMIT 50`,
    [userId, email || '']
  );
  return rows;
}

export async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT id, user_id, email FROM notifications WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

export async function markRead(id) {
  await pool.execute(
    'UPDATE notifications SET read_at = NOW() WHERE id = ? AND read_at IS NULL',
    [id]
  );
}

export async function adminFindPageable(page, limit) {
  const [rows] = await pool.execute(
    `SELECT id, to_email, from_email, subject, provider, status, error, created_at
     FROM email_logs ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    [limit, (page - 1) * limit]
  );
  return rows;
}

export async function adminCount() {
  const [rows] = await pool.execute('SELECT COUNT(*) AS cnt FROM email_logs');
  return Number(rows[0].cnt);
}

export default {
  findTemplateByType,
  insertNotification,
  insertEmailLog,
  listForUser,
  findById,
  markRead,
  adminFindPageable,
  adminCount,
};