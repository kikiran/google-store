import { asyncHandler, ApiError, success } from '@nova/shared';
import authService from '../services/auth.service.js';

const TRANSLATIONS = {
  ACCOUNT_EXISTS: { status: 409, code: 'DUPLICATE_RESOURCE', message: 'An account with this email already exists' },
  INVALID_CREDENTIALS: { status: 401, code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password' },
  NO_REFRESH_TOKEN: { status: 401, code: 'UNAUTHENTICATED', message: 'No refresh token provided' },
  INVALID_REFRESH_TOKEN: { status: 401, code: 'INVALID_REFRESH_TOKEN', message: 'Session has expired, please sign in again' },
  INVALID_RESET_TOKEN: { status: 400, code: 'INVALID_RESET_TOKEN', message: 'This reset link is invalid or has expired' },
  INVALID_VERIFICATION_TOKEN: { status: 400, code: 'INVALID_VERIFICATION_TOKEN', message: 'Verification link is invalid or has expired' },
  NOT_FOUND: { status: 404, code: 'NOT_FOUND', message: 'Account not found' },
};

function raise(error) {
  const t = TRANSLATIONS[error.message];
  if (t) throw new ApiError(t.status, t.code, t.message);
  throw error;
}

export const register = asyncHandler(async (req, res) => {
  try {
    const result = await authService.register(req.body, req);
    authService.setAuthCookies(res, result.accessToken, result.refreshToken);
    success(res, { user: result.user }, 'Account created successfully', undefined, 201);
  } catch (error) {
    raise(error);
  }
});

export const login = asyncHandler(async (req, res) => {
  try {
    const result = await authService.login(req.body, req);
    authService.setAuthCookies(res, result.accessToken, result.refreshToken);
    success(res, { user: result.user }, 'Signed in successfully');
  } catch (error) {
    raise(error);
  }
});

export const refresh = asyncHandler(async (req, res) => {
  try {
    const result = await authService.refresh(req.cookies.nova_refresh, req);
    authService.setAuthCookies(res, result.accessToken, result.refreshToken);
    success(res, { user: result.user }, 'Session refreshed');
  } catch (error) {
    raise(error);
  }
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies.nova_refresh);
  res.clearCookie('nova_access', { httpOnly: true, sameSite: 'lax', path: '/' });
  res.clearCookie('nova_refresh', { httpOnly: true, sameSite: 'lax', path: '/' });
  success(res, null, 'Signed out');
});

export const me = asyncHandler(async (req, res) => {
  try {
    const user = await authService.me(req.user.id);
    success(res, { user }, 'Current user');
  } catch (error) {
    raise(error);
  }
});

export const forgotPassword = asyncHandler(async (req, res) => {
  try {
    await authService.forgotPassword(req.body);
    success(res, null, 'If the email exists, a reset link has been sent');
  } catch (error) {
    raise(error);
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  try {
    await authService.resetPassword(req.body);
    success(res, null, 'Password updated. Please sign in.');
  } catch (error) {
    raise(error);
  }
});

export const verifyEmail = asyncHandler(async (req, res) => {
  try {
    await authService.verifyEmail(req.query);
    success(res, null, 'Email verified');
  } catch (error) {
    raise(error);
  }
});

export default { register, login, refresh, logout, me, forgotPassword, resetPassword, verifyEmail };