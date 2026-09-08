import bcrypt from 'bcryptjs';

const ROUNDS = 12;

export async function hashPassword(password) {
  return bcrypt.hash(password, ROUNDS);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export default { hashPassword, comparePassword };