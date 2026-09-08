import { Router } from 'express';
import { middleware } from '@nova/shared';
import controller from '../controllers/shipping.controller.js';
import {
  createShipmentSchema,
  getShipmentByOrderSchema,
  getShipmentByTrackingSchema,
  addEventSchema,
} from '../schemas/shipping.schema.js';

const router = Router();
const { validate } = middleware;

router.get('/methods', controller.listMethods);
router.post('/shipments', validate(createShipmentSchema), controller.createShipment);
router.get('/shipments/by-order/:orderId', validate(getShipmentByOrderSchema), controller.getByOrderId);
router.get('/shipments/:trackingNumber', validate(getShipmentByTrackingSchema), controller.getByTrackingNumber);
router.patch('/shipments/:id/events', validate(addEventSchema), controller.addEvent);

export default router;
