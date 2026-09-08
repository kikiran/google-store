/**
 * Initializes the MySQL schemas and tables.
 * Usage: npm run db:init
 * Requires a running MySQL server with credentials from .env (DB_USER/DB_PASSWORD).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { config } from '@nova/shared';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const initPath = path.join(root, 'mysql', 'init.sql');

async function main() {
  const host = config.env('DB_HOST', 'localhost');
  const port = config.envInt('DB_PORT', 3306);
  const user = config.env('DB_USER', 'nova');
  const password = config.env('DB_PASSWORD', 'nova_secret');

  const sql = fs.readFileSync(initPath, 'utf8');

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
    connectTimeout: 30_000,
    ...config.tlsOptions(),
  });
  console.log(`Connected to MySQL at ${host}:${port}`);
  await conn.query(sql);
  console.log('Schemas and tables created successfully.');
  await conn.end();
}

main().catch((err) => {
  console.error('DB init failed:', err.code || err.name, err.message);
  if (err.stack) console.error(err.stack.split('\n').slice(0, 4).join('\n'));
  process.exit(1);
});