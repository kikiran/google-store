import { Router } from 'express';
import { ApiError, config, middleware } from '@nova/shared';
import controller from '../controllers/notification.controller.js';
import { sendNotificationSchema, markReadSchema } from '../schemas/notification.schema.js';

const router = Router();
const { validate, requireAuth } = middleware;

function requireServiceToken(req, res, next) {
  const expected = config.env('SERVICE_TOKEN', 'nova-internal');
  if (req.headers['x-service-token'] !== expected) {
    return next(ApiError.forbidden('INSUFFICIENT_ROLE', 'Invalid or missing service token'));
  }
  return next();
}

router.get('/', requireAuth, controller.list);
router.patch('/:id/read', requireAuth, validate(markReadSchema), controller.markRead);
router.post('/send', requireServiceToken, validate(sendNotificationSchema), controller.send);

export default router;