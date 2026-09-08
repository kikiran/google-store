import { ApiError } from '@nova/shared';
import userRepository from '../repositories/user.repository.js';

function serializeMe(userRow, profileRow, addressesCount) {
  return {
    id: String(userRow.id),
    email: userRow.email,
    firstName: userRow.first_name,
    lastName: userRow.last_name,
    phone: userRow.phone,
    role: userRow.role,
    avatarUrl: userRow.avatar_url,
    emailVerified: Boolean(userRow.email_verified_at),
    createdAt: userRow.created_at,
    profile: {
      bio: profileRow?.bio ?? null,
      newsletterOptIn: Boolean(profileRow?.newsletter_opt_in),
      preferredLanguage: profileRow?.preferred_language || 'en',
      currency: profileRow?.currency || 'INR',
    },
    addressesCount,
  };
}

function serializeAdminUser(row) {
  return {
    id: String(row.id),
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    role: row.role,
    avatarUrl: row.avatar_url,
    emailVerified: Boolean(row.email_verified_at),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getMe(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw ApiError.notFound('NOT_FOUND', 'User not found');
  const [profile, addressesCount] = await Promise.all([
    userRepository.findProfile(userId),
    userRepository.countAddresses(userId),
  ]);
  return serializeMe(user, profile, addressesCount);
}

export async function updateMe(userId, body) {
  const user = await userRepository.findById(userId);
  if (!user) throw ApiError.notFound('NOT_FOUND', 'User not found');

  const userFields = {};
  if (body.firstName !== undefined) userFields.firstName = body.firstName;
  if (body.lastName !== undefined) userFields.lastName = body.lastName;
  if (body.phone !== undefined) userFields.phone = body.phone;
  if (body.avatarUrl !== undefined) userFields.avatarUrl = body.avatarUrl;

  const profileFields = {};
  if (body.bio !== undefined) profileFields.bio = body.bio;
  if (body.newsletterOptIn !== undefined) profileFields.newsletterOptIn = body.newsletterOptIn;
  if (body.preferredLanguage !== undefined) profileFields.preferredLanguage = body.preferredLanguage;

  if (Object.keys(userFields).length > 0) await userRepository.updateUser(userId, userFields);
  const profile = await userRepository.upsertProfile(userId, profileFields);

  return {
    firstName: userFields.firstName ?? user.first_name,
    lastName: userFields.lastName ?? user.last_name,
    phone: userFields.phone !== undefined ? userFields.phone : user.phone,
    avatarUrl: userFields.avatarUrl !== undefined ? userFields.avatarUrl : user.avatar_url,
    bio: profile?.bio ?? null,
    newsletterOptIn: Boolean(profile?.newsletter_opt_in),
    preferredLanguage: profile?.preferred_language || 'en',
    currency: profile?.currency || 'INR',
  };
}

export async function adminListUsers({ page, limit, q, role }) {
  const [rows, total] = await Promise.all([
    userRepository.findPaged({ page, limit, q, role }),
    userRepository.countPaged({ q, role }),
  ]);
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    users: rows.map(serializeAdminUser),
    meta: { page, limit, total, totalPages },
  };
}

export async function adminUpdateRole(actorId, actorRole, targetId, role) {
  const target = await userRepository.findById(targetId);
  if (!target) throw ApiError.notFound('NOT_FOUND', 'User not found');
  if (actorRole === 'ADMIN' && String(actorId) === String(targetId)) {
    throw ApiError.forbidden('INSUFFICIENT_ROLE', 'You cannot change your own role');
  }
  return serializeAdminUser(await userRepository.updateRole(targetId, role));
}

export async function adminUpdateStatus(actorId, targetId, isActive) {
  const target = await userRepository.findById(targetId);
  if (!target) throw ApiError.notFound('NOT_FOUND', 'User not found');
  if (String(actorId) === String(targetId) && !isActive) {
    throw ApiError.forbidden('INSUFFICIENT_ROLE', 'You cannot deactivate your own account');
  }
  return serializeAdminUser(await userRepository.updateStatus(targetId, isActive));
}

export async function adminDeleteUser(actorId, targetId) {
  const target = await userRepository.findById(targetId);
  if (!target) throw ApiError.notFound('NOT_FOUND', 'User not found');
  if (String(actorId) === String(targetId)) {
    throw ApiError.forbidden('INSUFFICIENT_ROLE', 'You cannot delete your own account');
  }
  await userRepository.softDelete(targetId);
  return null;
}

export default {
  getMe,
  updateMe,
  adminListUsers,
  adminUpdateRole,
  adminUpdateStatus,
  adminDeleteUser,
};