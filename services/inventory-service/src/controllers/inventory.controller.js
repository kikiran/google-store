import { asyncHandler, success, created } from '@nova/shared';
import inventoryService from '../services/inventory.service.js';

export const getVariantStock = asyncHandler(async (req, res) => {
  const stock = await inventoryService.getVariantStock(req.params.id);
  success(res, stock, 'Inventory retrieved');
});

export const getProductSummary = asyncHandler(async (req, res) => {
  const items = await inventoryService.getProductSummary(req.query.productId);
  success(res, items, 'Product inventory summary');
});

export const createReservation = asyncHandler(async (req, res) => {
  const result = await inventoryService.createReservation(req.body);
  created(res, result, 'Stock reserved');
});

export const releaseReservation = asyncHandler(async (req, res) => {
  const result = await inventoryService.releaseReservation(req.body.orderId);
  success(res, result, 'Reservation released');
});

export const confirmReservation = asyncHandler(async (req, res) => {
  const result = await inventoryService.confirmReservation(req.body.orderId);
  success(res, result, 'Reservation confirmed');
});

export default { getVariantStock, getProductSummary, createReservation, releaseReservation, confirmReservation };
