import { Router } from 'express';
import controller from '../controllers/product.controller.js';

const router = Router();

router.get('/', controller.listPromotions);

export default router;
