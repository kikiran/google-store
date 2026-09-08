import { config, crypto, jwt, logger } from '@nova/shared';
import userRepository from '../repositories/user.repository.js';
import tokenRepository from '../repositories/token.repository.js';

const frontendUrl = () => config.env('VITE_FRONTEND_URL', 'http://localhost:5173');
const notificationUrl = () => config.env('NOTIFICATION_SERVICE_URL', 'http://localhost:3011');

const ACCESS_MAX_AGE = 15 * 60 * 1000;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function safeUser(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  void password_hash;
  return {
    id: String(rest.id),
    email: rest.email,
    firstName: rest.first_name,
    lastName: rest.last_name,
    role: rest.role,
    emailVerifiedAt: rest.email_verified_at,
    avatarUrl: rest.avatar_url,
    createdAt: rest.created_at,
  };
}

async function issueTokens(user, req) {
  const accessToken = jwt.signAccessToken({
    sub: String(user.id),
    email: user.email,
    name: `${user.first_name} ${user.last_name}`.trim(),
    role: user.role,
  });

  const refreshToken = jwt.signRefreshToken({ sub: String(user.id), jti: jwt.randomHex(12) });
  const expiresAt = new Date(Date.now() + REFRESH_MAX_AGE);
  const tokenHash = jwt.hashToken(refreshToken);
  await tokenRepository.createRefreshToken({
    userId: user.id,
    tokenHash,
    expiresAt,
    ip: req.ip,
    userAgent: req.get('user-agent')?.slice(0, 300),
  });

  return { accessToken, refreshToken };
}

function setAuthCookies(res, accessToken, refreshToken) {
  const secure = config.envBool('COOKIE_SECURE', false);
  const common = { httpOnly: true, sameSite: 'lax', secure, path: '/' };
  res.cookie('nova_access', accessToken, { ...common, maxAge: ACCESS_MAX_AGE });
  res.cookie('nova_refresh', refreshToken, { ...common, maxAge: REFRESH_MAX_AGE });
}

async function sendNotification(type, payload) {
  try {
    const res = await fetch(`${notificationUrl()}/api/notifications/send`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-service-token': process.env.SERVICE_TOKEN || 'nova-internal' },
      body: JSON.stringify({ type, ...payload }),
    });
    if (!res.ok) logger.warn({ status: res.status, type }, 'notification send failed');
  } catch (err) {
    logger.warn({ err: err.message, type }, 'notification service unreachable');
  }
}

export async function register({ firstName, lastName, email, password }, req) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new Error('ACCOUNT_EXISTS');
  }
  const passwordHash = await crypto.hashPassword(password);
  const user = await userRepository.create({ email, passwordHash, firstName, lastName });
  await tokenRepository.createEmailVerificationToken({
    userId: user.id,
    tokenHash: jwt.hashToken(jwt.randomHex(24)),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
  });

  const { accessToken, refreshToken } = await issueTokens(user, req);
  await userRepository.updateLastLogin(user.id);

  void sendNotification('welcome', { email, name: firstName });

  return {
    user: safeUser({ ...user, first_name: firstName, last_name: lastName }),
    accessToken,
    refreshToken,
  };
}

export async function login({ email, password }, req) {
  const user = await userRepository.findByEmail(email);
  if (!user || user.is_active === 0) {
    throw new Error('INVALID_CREDENTIALS');
  }
  const ok = await crypto.comparePassword(password, user.password_hash);
  if (!ok) {
    throw new Error('INVALID_CREDENTIALS');
  }
  await userRepository.updateLastLogin(user.id);
  const { accessToken, refreshToken } = await issueTokens(user, req);
  return { user: safeUser(user), accessToken, refreshToken };
}

export async function refresh(refreshToken, req) {
  if (!refreshToken) throw new Error('NO_REFRESH_TOKEN');

  const payload = jwt.verifyRefreshToken(refreshToken);
  if (!payload || !payload.sub) throw new Error('INVALID_REFRESH_TOKEN');

  const stored = await tokenRepository.findRefreshTokenByHash(jwt.hashToken(refreshToken));
  if (!stored || stored.revoked_at || new Date(stored.expires_at) < new Date()) {
    throw new Error('INVALID_REFRESH_TOKEN');
  }

  const user = await userRepository.findById(stored.user_id);
  if (!user || user.is_active === 0) {
    throw new Error('INVALID_REFRESH_TOKEN');
  }

  const { accessToken, refreshToken: newRefresh } = await issueTokens(user, req);
  await tokenRepository.markReplaced(stored.id, jwt.hashToken(newRefresh));
  await tokenRepository.revokeRefreshToken(stored.id);

  return { user: safeUser(user), accessToken, refreshToken: newRefresh };
}

export async function logout(refreshToken) {
  if (refreshToken) {
    const stored = await tokenRepository.findRefreshTokenByHash(jwt.hashToken(refreshToken));
    if (stored && !stored.revoked_at) {
      await tokenRepository.revokeRefreshToken(stored.id);
    }
  }
}

export async function me(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw new Error('NOT_FOUND');
  return safeUser(user);
}

export async function forgotPassword({ email }) {
  const user = await userRepository.findByEmail(email);
  if (!user) return; // never leak account existence
  const raw = jwt.randomHex(32);
  await tokenRepository.createPasswordResetToken({
    userId: user.id,
    tokenHash: jwt.hashToken(raw),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });
  const link = `${frontendUrl()}/reset-password?token=${raw}`;
  void sendNotification('password_reset', {
    email: user.email,
    name: user.first_name,
    link,
  });
}

export async function resetPassword({ token, password }) {
  const tokenHash = jwt.hashToken(token);
  const record = await tokenRepository.findValidPasswordResetToken(tokenHash);
  if (!record) throw new Error('INVALID_RESET_TOKEN');
  const passwordHash = await crypto.hashPassword(password);
  await userRepository.updatePassword(record.user_id, passwordHash);
  await tokenRepository.markPasswordResetTokenUsed(record.id);
  await tokenRepository.revokeAllForUser(record.user_id);
}

export async function verifyEmail({ token }) {
  const tokenHash = jwt.hashToken(token);
  const record = await tokenRepository.findValidVerificationToken(tokenHash);
  if (!record) throw new Error('INVALID_VERIFICATION_TOKEN');
  await userRepository.updateEmailVerified(record.user_id);
  await tokenRepository.markVerificationTokenUsed(record.id);
}

export default {
  register,
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword,
  verifyEmail,
  safeUser,
  setAuthCookies,
};