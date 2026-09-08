import { Router } from 'express';
import { middleware } from '@nova/shared';
import controller from '../controllers/order.controller.js';
import {
  checkoutSchema,
  orderNumberParams,
  orderNumberEmailQuery,
  cancelSchema,
  confirmPaymentSchema,
} from '../schemas/order.schema.js';

const router = Router();
const { validate, requireAuth } = middleware;

router.post('/', validate(checkoutSchema), controller.createOrder);
router.get('/mine', requireAuth, controller.getMyOrders);
router.post('/:orderNumber/cancel', validate(cancelSchema), validate(orderNumberEmailQuery), controller.cancelOrder);
router.post('/:orderNumber/confirm-payment', validate(confirmPaymentSchema), validate(orderNumberEmailQuery), controller.confirmPayment);
router.get('/:orderNumber', validate(orderNumberParams), validate(orderNumberEmailQuery), controller.getOrderDetail);

export default router;
