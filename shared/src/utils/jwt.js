import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/index.js';

const accessSecret = () => env('JWT_ACCESS_SECRET', 'dev_access_secret_change_me');
const refreshSecret = () => env('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me');
const accessTtl = () => env('JWT_ACCESS_TTL', '15m');
const refreshTtl = () => env('JWT_REFRESH_TTL', '7d');
const issuer = () => env('JWT_ISSUER', 'nova-store');

export function signAccessToken(payload) {
  return jwt.sign(payload, accessSecret(), {
    expiresIn: accessTtl(),
    issuer: issuer(),
    audience: 'nova-store-client',
  });
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, accessSecret(), { issuer: issuer(), audience: 'nova-store-client' });
  } catch {
    return null;
  }
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, refreshSecret(), {
    expiresIn: refreshTtl(),
    issuer: issuer(),
    audience: 'nova-store-client',
  });
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, refreshSecret(), { issuer: issuer(), audience: 'nova-store-client' });
  } catch {
    return null;
  }
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function randomHex(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function randomId(prefix = '') {
  return `${prefix}${crypto.randomBytes(8).toString('hex')}`;
}

export default {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  randomHex,
  randomId,
};