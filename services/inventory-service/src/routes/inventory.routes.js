import { Router } from 'express';
import { middleware } from '@nova/shared';
import controller from '../controllers/inventory.controller.js';
import {
  variantIdParams,
  summaryQuery,
  createReservationSchema,
  releaseReservationSchema,
  confirmReservationSchema,
} from '../schemas/inventory.schema.js';

const router = Router();
const { validate } = middleware;

router.get('/summary', validate(summaryQuery), controller.getProductSummary);
router.get('/variants/:id', validate(variantIdParams), controller.getVariantStock);
router.post('/reservations/release', validate(releaseReservationSchema), controller.releaseReservation);
router.post('/reservations/confirm', validate(confirmReservationSchema), controller.confirmReservation);
router.post('/reservations', validate(createReservationSchema), controller.createReservation);

export default router;
