import { asyncHandler, success } from '@nova/shared';
import adminService from '../services/admin.service.js';

export const listOrders = asyncHandler(async (req, res) => {
  const { page, limit, status, q } = req.query;
  const result = await adminService.listAdminOrders({ status, q, page, limit });
  success(res, result.items, 'Orders retrieved', result.meta);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const result = await adminService.updateAdminOrderStatus(Number(req.params.id), req.body, { id: req.user?.id || null });
  success(res, result, 'Order status updated');
});

export default { listOrders, updateStatus };
