import { Router } from 'express';
import { middleware } from '@nova/shared';
import controller from '../controllers/payment.controller.js';
import { chargeSchema, refundSchema, getByOrderSchema } from '../schemas/payment.schema.js';

const router = Router();
const { validate } = middleware;

router.post('/charge', validate(chargeSchema), controller.charge);
router.post('/refund', validate(refundSchema), controller.refund);
router.get('/:orderId', validate(getByOrderSchema), controller.getByOrderId);

export default router;
