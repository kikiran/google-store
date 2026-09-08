import pool from '../db.js';
import { db } from '@nova/shared';

export async function findActiveBySlug(slug) {
  const [rows] = await pool.execute(
    'SELECT id, slug, name, description, parent_id, image_url, icon, sort_order, is_active FROM categories WHERE slug = ? AND is_active = 1 LIMIT 1',
    [slug]
  );
  return rows[0] || null;
}

export async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT id, slug, name, description, parent_id, image_url, icon, sort_order, is_active, created_at, updated_at FROM categories WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

export async function findActiveAll() {
  const [rows] = await pool.execute(
    `SELECT c.id, c.slug, c.name, c.description, c.parent_id, c.image_url, c.icon, c.sort_order, c.is_active,
      (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status != 'archived' AND p.deleted_at IS NULL) AS product_count
     FROM categories c WHERE c.is_active = 1 ORDER BY c.sort_order ASC, c.name ASC`
  );
  return rows;
}

export async function create({ slug, name, description, parentId, imageUrl, icon, sortOrder, isActive }) {
  const [result] = await pool.execute(
    `INSERT INTO categories (slug, name, description, parent_id, image_url, icon, sort_order, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [slug, name, description || null, parentId || null, imageUrl || null, icon || null, sortOrder || 0, isActive ? 1 : 0]
  );
  return findById(result.insertId);
}

export async function update(id, fields) {
  const setClauses = [];
  const values = [];
  const mapping = {
    slug: 'slug', name: 'name', description: 'description', parentId: 'parent_id',
    imageUrl: 'image_url', icon: 'icon', sortOrder: 'sort_order', isActive: 'is_active',
  };
  for (const [key, col] of Object.entries(mapping)) {
    if (fields[key] !== undefined) {
      setClauses.push(`${col} = ?`);
      values.push(key === 'isActive' ? (fields[key] ? 1 : 0) : fields[key]);
    }
  }
  if (setClauses.length === 0) return findById(id);
  values.push(id);
  await pool.execute(`UPDATE categories SET ${setClauses.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

export async function remove(id) {
  await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
}

export async function countProducts(categoryId) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS cnt FROM products WHERE category_id = ? AND status != 'archived' AND deleted_at IS NULL`,
    [categoryId]
  );
  return rows[0].cnt;
}

export default { findActiveBySlug, findById, findActiveAll, create, update, remove, countProducts };
