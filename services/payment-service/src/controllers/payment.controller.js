import { asyncHandler, created, success } from '@nova/shared';
import paymentService from '../services/payment.service.js';

export const charge = asyncHandler(async (req, res) => {
  const payment = await paymentService.chargePayment(req.body);
  created(res, payment, 'Payment processed');
});

export const refund = asyncHandler(async (req, res) => {
  const refund = await paymentService.refundPayment(req.body);
  success(res, refund, 'Refund processed');
});

export const getByOrderId = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentByOrderId(Number(req.params.orderId));
  success(res, payment, 'Payment retrieved');
});

export default { charge, refund, getByOrderId };
