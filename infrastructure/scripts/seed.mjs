/**
 * Seeds demo data into all Nova Store schemas.
 * Usage: npm run db:seed
 * Demo accounts:
 *   admin@nova.dev / NovaAdmin123!   (ADMIN)
 *   manager@nova.dev / NovaManager123! (MANAGER)
 *   customer@nova.dev / Customer123! (CUSTOMER)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { config } from '@nova/shared';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const seedPath = path.join(root, 'mysql', 'seed.sql');

async function main() {
  const host = config.env('DB_HOST', 'localhost');
  const port = config.envInt('DB_PORT', 3306);
  const user = config.env('DB_USER', 'nova');
  const password = config.env('DB_PASSWORD', 'nova_secret');

  const sql = fs.readFileSync(seedPath, 'utf8');

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
  const results = await conn.query(sql);
  console.log('Seed data inserted successfully.');
  await conn.end();
}

main().catch((err) => {
  console.error('DB seed failed:', err.code || err.name, err.message);
  if (err.stack) console.error(err.stack.split('\n').slice(0, 4).join('\n'));
  process.exit(1);
});