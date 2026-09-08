import { ApiError, db, logger } from '@nova/shared';
import { pool } from '../db.js';
import inventoryRepository from '../repositories/inventory.repository.js';
import crypto from 'node:crypto';

export async function getVariantStock(variantId) {
  const inv = await inventoryRepository.findByVariantId(variantId);
  if (!inv) {
    return { variantId: String(variantId), quantity: 0, reservedQuantity: 0, available: 0, lowStockThreshold: 5 };
  }
  return {
    variantId: String(inv.variant_id),
    quantity: inv.quantity,
    reservedQuantity: inv.reserved_quantity,
    available: inv.quantity - inv.reserved_quantity,
    lowStockThreshold: inv.low_stock_threshold,
  };
}

export async function getProductSummary(productId) {
  const rows = await inventoryRepository.getSummaryByProductId(productId);
  return rows.map((r) => ({
    variantId: String(r.variant_id),
    variantName: r.variantName,
    sku: r.sku,
    color: r.color,
    storage: r.storage,
    quantity: r.quantity,
    reservedQuantity: r.reserved_quantity,
    available: r.quantity - r.reserved_quantity,
    lowStockThreshold: r.low_stock_threshold,
  }));
}

export async function createReservation({ orderId, items }) {
  return db.transaction(pool, async (conn) => {
    const reserved = [];
    const insufficient = [];

    for (const item of items) {
      const inv = await inventoryRepository.findByVariantIdForUpdate(conn, item.variantId);
      if (!inv) {
        insufficient.push({ variantId: String(item.variantId), requested: item.quantity, available: 0 });
        continue;
      }
      const available = inv.quantity - inv.reserved_quantity;
      if (available < item.quantity) {
        insufficient.push({ variantId: String(item.variantId), requested: item.quantity, available });
        continue;
      }

      const newReserved = inv.reserved_quantity + item.quantity;
      await inventoryRepository.setReservedQuantity(item.variantId, newReserved, conn);
      reserved.push({ variantId: String(item.variantId), quantity: item.quantity });
    }

    if (insufficient.length > 0) {
      throw new ApiError(409, 'INSUFFICIENT_STOCK', 'Insufficient stock for some items', insufficient);
    }

    const reservationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    for (const item of items) {
      await inventoryRepository.createReservation({
        reservationToken,
        orderId,
        variantId: item.variantId,
        quantity: item.quantity,
        expiresAt,
      });
      await inventoryRepository.logMovement({
        variantId: item.variantId,
        changeType: 'reserve',
        quantityChange: item.quantity,
        referenceType: 'order',
        referenceId: orderId,
        note: `Reserved ${item.quantity} for order #${orderId}`,
      });
    }

    return { reservationToken, reserved };
  });
}

export async function releaseReservation(orderId) {
  return db.transaction(pool, async (conn) => {
    const reservations = await inventoryRepository.findActiveReservationsByOrder(orderId);
    if (reservations.length === 0) {
      throw ApiError.notFound('NOT_FOUND', 'No active reservations found for this order');
    }

    for (const res of reservations) {
      const inv = await inventoryRepository.findByVariantIdForUpdate(conn, res.variant_id);
      if (inv) {
        const newReserved = Math.max(0, inv.reserved_quantity - res.quantity);
        await inventoryRepository.setReservedQuantity(res.variant_id, newReserved, conn);
      }
      await inventoryRepository.logMovement({
        variantId: res.variant_id,
        changeType: 'release',
        quantityChange: -res.quantity,
        referenceType: 'order',
        referenceId: orderId,
        note: `Released ${res.quantity} from order #${orderId}`,
      });
    }

    await inventoryRepository.updateReservationStatus(orderId, 'RELEASED', conn);
    return { released: reservations.length };
  });
}

export async function confirmReservation(orderId) {
  return db.transaction(pool, async (conn) => {
    const reservations = await inventoryRepository.findActiveReservationsByOrder(orderId);
    if (reservations.length === 0) {
      throw ApiError.notFound('NOT_FOUND', 'No active reservations found for this order');
    }

    for (const res of reservations) {
      const inv = await inventoryRepository.findByVariantIdForUpdate(conn, res.variant_id);
      if (inv) {
        const newQuantity = inv.quantity - res.quantity;
        if (newQuantity < 0) {
          throw ApiError.conflict('INSUFFICIENT_STOCK', `Insufficient stock for variant ${res.variant_id}`);
        }
        await inventoryRepository.setQuantity(res.variant_id, newQuantity, conn);
        const newReserved = Math.max(0, inv.reserved_quantity - res.quantity);
        await inventoryRepository.setReservedQuantity(res.variant_id, newReserved, conn);
      }
      await inventoryRepository.logMovement({
        variantId: res.variant_id,
        changeType: 'deduct',
        quantityChange: -res.quantity,
        referenceType: 'order',
        referenceId: orderId,
        note: `Confirmed ${res.quantity} deducted for order #${orderId}`,
      });
    }

    await inventoryRepository.updateReservationStatus(orderId, 'CONFIRMED', conn);
    return { confirmed: reservations.length };
  });
}

export async function adminListInventory(filters) {
  const { rows, total } = await inventoryRepository.adminList(filters);
  return {
    items: rows.map((r) => ({
      id: String(r.id),
      variantId: String(r.variantId),
      sku: r.sku,
      variantName: r.variantName,
      color: r.color,
      storage: r.storage,
      productId: String(r.productId),
      productName: r.productName,
      productSlug: r.productSlug,
      categoryName: r.categoryName,
      quantity: r.quantity,
      reservedQuantity: r.reservedQuantity,
      available: r.quantity - r.reservedQuantity,
      lowStockThreshold: r.lowStockThreshold,
      updatedAt: r.updatedAt,
    })),
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function adminUpdateInventory(variantId, data) {
  const inv = await inventoryRepository.findByVariantId(variantId);
  if (!inv) throw ApiError.notFound('NOT_FOUND', 'Inventory record not found');

  if (data.delta !== undefined) {
    const newQuantity = inv.quantity + data.delta;
    if (newQuantity < 0) {
      throw ApiError.conflict('CONFLICT', 'Quantity cannot go below zero');
    }
    await inventoryRepository.adjustQuantity(variantId, data.delta);
    const changeType = data.delta > 0 ? 'restock' : 'adjust';
    await inventoryRepository.logMovement({
      variantId,
      changeType,
      quantityChange: data.delta,
      referenceType: 'admin',
      note: `Admin ${changeType}: ${data.delta > 0 ? '+' : ''}${data.delta}`,
    });
  } else if (data.quantity !== undefined) {
    await inventoryRepository.setQuantity(variantId, data.quantity);
    await inventoryRepository.logMovement({
      variantId,
      changeType: 'adjust',
      quantityChange: data.quantity - inv.quantity,
      referenceType: 'admin',
      note: `Admin set quantity to ${data.quantity}`,
    });
  }

  if (data.lowStockThreshold !== undefined) {
    await inventoryRepository.updateLowStockThreshold(variantId, data.lowStockThreshold);
  }

  return getVariantStock(variantId);
}

export default {
  getVariantStock, getProductSummary, createReservation, releaseReservation,
  confirmReservation, adminListInventory, adminUpdateInventory,
};
