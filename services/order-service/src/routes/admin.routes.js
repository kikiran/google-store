import { Router } from 'express';
import { middleware } from '@nova/shared';
import controller from '../controllers/admin.controller.js';
import { listOrdersQuery, updateStatusSchema } from '../schemas/admin.schema.js';

const router = Router();
const { validate, requireRole } = middleware;

router.get('/', requireRole('ADMIN', 'MANAGER'), validate(listOrdersQuery), controller.listOrders);
router.patch('/:id/status', requireRole('ADMIN', 'MANAGER'), validate(updateStatusSchema), controller.updateStatus);

export default router;
