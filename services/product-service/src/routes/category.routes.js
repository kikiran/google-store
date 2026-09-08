import { Router } from 'express';
import { middleware } from '@nova/shared';
import controller from '../controllers/product.controller.js';

const router = Router();

router.get('/', controller.listCategories);
router.get('/:slug', controller.getCategory);

export default router;
