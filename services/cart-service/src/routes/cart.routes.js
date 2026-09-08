import { Router } from 'express';
import { middleware } from '@nova/shared';
import controller from '../controllers/cart.controller.js';
import { addItemSchema, updateItemSchema, removeItemSchema, mergeSchema } from '../schemas/cart.schema.js';

const router = Router();
const { validate, requireAuth } = middleware;

router.get('/', controller.getCart);
router.post('/items', validate(addItemSchema), controller.addItem);
router.patch('/items/:id', validate(updateItemSchema), controller.updateItem);
router.delete('/items/:id', validate(removeItemSchema), controller.removeItem);
router.delete('/', controller.clearCart);
router.post('/merge', requireAuth, validate(mergeSchema), controller.mergeGuestCart);
router.get('/count', controller.getCount);

export default router;
