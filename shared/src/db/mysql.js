import mysql from 'mysql2/promise';
import { tlsOptions } from '../config/index.js';

/**
 * Create a connection pool for a MySQL schema.
 * Each service owns a logical schema (separate database on the same server
 * for local development, movable to dedicated instances later).
 */
export function createPool(config) {
  return mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionLimit: config.connectionLimit || 10,
    namedPlaceholders: true,
    timezone: 'Z',
    waitForConnections: true,
    queueLimit: 0,
    dateStrings: false,
    ...tlsOptions(),
  });
}

export async function execute(pool, sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function query(pool, sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function transaction(pool, work) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export default { createPool, execute, query, transaction };