import { Router } from 'express';
import { middleware } from '@nova/shared';
import controller from '../controllers/admin.controller.js';
import {
  adminInventoryQuery,
  adminUpdateInventorySchema,
} from '../schemas/inventory.schema.js';

const router = Router();
const { validate, requireRole } = middleware;

const adminAuth = requireRole('ADMIN', 'MANAGER');

router.get('/inventory', adminAuth, validate(adminInventoryQuery), controller.adminListInventory);
router.patch('/inventory/variants/:id', adminAuth, validate(adminUpdateInventorySchema), controller.adminUpdateVariant);

export default router;
