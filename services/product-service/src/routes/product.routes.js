import { Router } from 'express';
import { middleware } from '@nova/shared';
import controller from '../controllers/product.controller.js';
import {
  listProductsSchema,
  productSlugParams,
  productIdParams,
} from '../schemas/product.schema.js';

const router = Router();
const { validate } = middleware;

router.get('/', validate(listProductsSchema), controller.listProducts);
router.get('/:id/related', validate(productIdParams), controller.getRelatedProducts);
router.get('/:slug', validate(productSlugParams), controller.getProduct);

export default router;
