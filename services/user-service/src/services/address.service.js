import { ApiError, db } from '@nova/shared';
import pool from '../db.js';
import addressRepository from '../repositories/address.repository.js';

function serializeAddress(a) {
  return {
    id: String(a.id),
    label: a.label,
    fullName: a.full_name,
    phone: a.phone,
    addressLine1: a.address_line1,
    addressLine2: a.address_line2,
    city: a.city,
    state: a.state,
    postalCode: a.postal_code,
    country: a.country,
    isDefault: Boolean(a.is_default),
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  };
}

export async function listAddresses(userId) {
  const rows = await addressRepository.listByUserId(userId);
  return rows.map(serializeAddress);
}

export async function createAddress(userId, data) {
  return db.transaction(pool, async (conn) => {
    const count = await addressRepository.countByUserId(userId, conn);
    const isDefault = data.isDefault || count === 0;
    if (isDefault) {
      await addressRepository.unsetAllDefaults(userId, conn);
    }
    const address = await addressRepository.create(userId, { ...data, isDefault }, conn);
    return serializeAddress(address);
  });
}

export async function updateAddress(userId, id, data) {
  return db.transaction(pool, async (conn) => {
    const existing = await addressRepository.findByIdAndUser(id, userId, conn);
    if (!existing) throw ApiError.notFound('ADDRESS_NOT_FOUND', 'Address not found');
    if (data.isDefault) {
      await addressRepository.unsetAllDefaults(userId, conn);
    }
    const updated = await addressRepository.update(id, userId, data, conn);
    return serializeAddress(updated);
  });
}

export async function deleteAddress(userId, id) {
  return db.transaction(pool, async (conn) => {
    const existing = await addressRepository.findByIdAndUser(id, userId, conn);
    if (!existing) throw ApiError.notFound('ADDRESS_NOT_FOUND', 'Address not found');
    await addressRepository.softDelete(id, userId, conn);
    if (existing.is_default) {
      await addressRepository.promoteNewDefault(userId, conn);
    }
    return null;
  });
}

export async function setDefaultAddress(userId, id) {
  return db.transaction(pool, async (conn) => {
    const existing = await addressRepository.findByIdAndUser(id, userId, conn);
    if (!existing) throw ApiError.notFound('ADDRESS_NOT_FOUND', 'Address not found');
    await addressRepository.ensureOnlyDefault(userId, id, conn);
    return serializeAddress(existing);
  });
}

export default {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};