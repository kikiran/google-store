import { Router } from 'express';
import { middleware } from '@nova/shared';
import controller from '../controllers/admin.controller.js';
import {
  createProductSchema,
  updateProductSchema,
  idParams,
  createCategorySchema,
  updateCategorySchema,
  createPromotionSchema,
  updatePromotionSchema,
} from '../schemas/product.schema.js';

const router = Router();
const { validate, requireRole } = middleware;

const adminAuth = requireRole('ADMIN', 'MANAGER');

// Product admin routes
router.get('/products', adminAuth, controller.adminListProducts);
router.get('/products/:id', adminAuth, validate(idParams), controller.adminGetProduct);
router.post('/products', adminAuth, validate(createProductSchema), controller.adminCreateProduct);
router.patch('/products/:id', adminAuth, validate(updateProductSchema), controller.adminUpdateProduct);
router.delete('/products/:id', adminAuth, validate(idParams), controller.adminDeleteProduct);

// Category admin routes
router.post('/categories', adminAuth, validate(createCategorySchema), controller.adminCreateCategory);
router.patch('/categories/:id', adminAuth, validate(updateCategorySchema), controller.adminUpdateCategory);
router.delete('/categories/:id', adminAuth, validate(idParams), controller.adminDeleteCategory);

// Promotion admin routes
router.post('/promotions', adminAuth, validate(createPromotionSchema), controller.adminCreatePromotion);
router.patch('/promotions/:id', adminAuth, validate(updatePromotionSchema), controller.adminUpdatePromotion);
router.delete('/promotions/:id', adminAuth, validate(idParams), controller.adminDeletePromotion);

export default router;
