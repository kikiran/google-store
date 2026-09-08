import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

/**
 * Load environment variables from the project root `.env`.
 * Searches from the current working directory upward so services started
 * via npm workspaces (CWD = service folder) still find the root .env.
 */
function loadRootEnv() {
  const here = fileURLToPath(new URL('.', import.meta.url));
  let dir = process.cwd();
  for (let i = 0; i < 10; i += 1) {
    const candidate = path.join(dir, '.env');
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate });
      return;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  dotenv.config({ path: path.resolve(here, '../../.env') });
}

loadRootEnv();

export function env(name, fallback = undefined) {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  return value;
}

export function envInt(name, fallback) {
  const value = env(name);
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function envBool(name, fallback = false) {
  const value = env(name);
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

export const isProd = () => env('NODE_ENV', 'development') === 'production';

export function serviceName(defaultName) {
  return env('SERVICE_NAME', defaultName);
}

const SCHEMA_DEFAULTS = {
  DB_USER_SCHEMA: 'nova_user',
  DB_PRODUCT_SCHEMA: 'nova_product',
  DB_INVENTORY_SCHEMA: 'nova_inventory',
  DB_CART_SCHEMA: 'nova_cart',
  DB_ORDER_SCHEMA: 'nova_order',
  DB_PAYMENT_SCHEMA: 'nova_payment',
  DB_SHIPPING_SCHEMA: 'nova_shipping',
  DB_REVIEW_SCHEMA: 'nova_review',
  DB_NOTIFICATION_SCHEMA: 'nova_notification',
};

export function dbConfig(schema) {
  return {
    host: env('DB_HOST', 'localhost'),
    port: envInt('DB_PORT', 3306),
    user: env('DB_USER', 'nova'),
    password: env('DB_PASSWORD', 'nova_secret'),
    database: env(schema, SCHEMA_DEFAULTS[schema] || schema),
    connectionLimit: envInt('DB_POOL_SIZE', 10),
  };
}

export function internalBaseUrl(name) {
  return env(name, `http://localhost:${envInt(name.replace('_URL', '').split('_').pop().toLowerCase().replace('service', ''), 3000)}`);
}

export function tlsOptions() {
  const opts = {};
  if (envBool('DB_SSL', false)) {
    opts.ssl = envBool('DB_SSL_INSECURE', true) ? { rejectUnauthorized: false } : {};
  }
  if (envBool('DB_ALLOW_PUBLIC_KEY', false)) {
    opts.allowPublicKeyRetrieval = true;
  }
  return opts;
}

export default {
  env,
  envInt,
  envBool,
  isProd,
  serviceName,
  dbConfig,
  loadRootEnv,
  tlsOptions,
};