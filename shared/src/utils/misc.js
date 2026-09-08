import { randomBytes } from 'node:crypto';
import { isProd } from '../config/index.js';

export function generateSessionKey() {
  return `sess_${randomBytes(20).toString('hex')}`;
}

export function inr(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format a decimal money value stored in the DB (paisa-safe). */
export function toMoneyNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export { isProd };