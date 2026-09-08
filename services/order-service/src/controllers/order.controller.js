import { asyncHandler, created, success } from '@nova/shared';
import orderService from '../services/order.service.js';

export const createOrder = asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] || null;
  const result = await orderService.createOrder(req.body, userId);
  created(res, result, 'Order placed successfully');
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await orderService.listMyOrders(req.user.id, page, limit);
  success(res, result.items, 'Orders retrieved', result.meta);
});

export const getOrderDetail = asyncHandler(async (req, res) => {
  const result = await orderService.getOrderDetail(req, req.params.orderNumber);
  success(res, result, 'Order retrieved');
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const result = await orderService.cancelOrder(req, req.params.orderNumber);
  success(res, result, 'Order cancelled');
});

export const confirmPayment = asyncHandler(async (req, res) => {
  const result = await orderService.confirmPayment(req, req.params.orderNumber);
  success(res, result, 'Payment confirmed');
});

export default { createOrder, getMyOrders, getOrderDetail, cancelOrder, confirmPayment };
