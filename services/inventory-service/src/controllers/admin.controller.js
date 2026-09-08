import { asyncHandler, success } from '@nova/shared';
import inventoryService from '../services/inventory.service.js';

export const adminListInventory = asyncHandler(async (req, res) => {
  const result = await inventoryService.adminListInventory(req.query);
  success(res, result.items, 'Inventory list retrieved', result.meta);
});

export const adminUpdateVariant = asyncHandler(async (req, res) => {
  const stock = await inventoryService.adminUpdateInventory(req.params.id, req.body);
  success(res, stock, 'Inventory updated');
});

export default { adminListInventory, adminUpdateVariant };
