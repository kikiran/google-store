import { Router } from 'express';
import { middleware } from '@nova/shared';
import controller from '../controllers/user.controller.js';
import {
  updateMeSchema,
  addressCreateSchema,
  addressUpdateSchema,
  addressIdParams,
} from '../schemas/user.schema.js';

const router = Router();
const { validate, requireAuth } = middleware;

router.use(requireAuth);

router.get('/me', controller.getMe);
router.patch('/me', validate(updateMeSchema), controller.updateMe);
router.get('/me/addresses', controller.listAddresses);
router.post('/me/addresses', validate(addressCreateSchema), controller.createAddress);
router.put('/me/addresses/:id', validate(addressUpdateSchema), controller.updateAddress);
router.delete('/me/addresses/:id', validate(addressIdParams), controller.deleteAddress);
router.put('/me/addresses/:id/default', validate(addressIdParams), controller.setDefaultAddress);

export default router;