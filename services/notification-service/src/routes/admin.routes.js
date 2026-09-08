import { Router } from 'express';
import { middleware } from '@nova/shared';
import controller from '../controllers/admin.controller.js';
import { adminListNotificationsSchema } from '../schemas/notification.schema.js';

const router = Router();
const { validate, requireRole } = middleware;

router.use(requireRole('ADMIN', 'MANAGER'));

router.get('/notifications', validate(adminListNotificationsSchema), controller.listEmailLogs);

export default router;