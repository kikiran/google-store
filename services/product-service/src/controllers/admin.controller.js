import { asyncHandler, success, created, noContent } from '@nova/shared';
import productService from '../services/product.service.js';
import categoryService from '../services/category.service.js';
import promotionService from '../services/promotion.service.js';

export const adminListProducts = asyncHandler(async (req, res) => {
  const result = await productService.adminListProducts(req.query);
  success(res, result.products, 'Products retrieved', result.meta);
});

export const adminGetProduct = asyncHandler(async (req, res) => {
  const product = await productService.adminGetProduct(req.params.id);
  success(res, product, 'Product retrieved');
});

export const adminCreateProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  created(res, product, 'Product created');
});

export const adminUpdateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  success(res, product, 'Product updated');
});

export const adminDeleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  noContent(res);
});

export const adminCreateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  created(res, category, 'Category created');
});

export const adminUpdateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  success(res, category, 'Category updated');
});

export const adminDeleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  noContent(res);
});

export const adminCreatePromotion = asyncHandler(async (req, res) => {
  const promo = await promotionService.createPromotion(req.body);
  created(res, promo, 'Promotion created');
});

export const adminUpdatePromotion = asyncHandler(async (req, res) => {
  const promo = await promotionService.updatePromotion(req.params.id, req.body);
  success(res, promo, 'Promotion updated');
});

export const adminDeletePromotion = asyncHandler(async (req, res) => {
  await promotionService.deletePromotion(req.params.id);
  noContent(res);
});

export default {
  adminListProducts, adminGetProduct, adminCreateProduct, adminUpdateProduct, adminDeleteProduct,
  adminCreateCategory, adminUpdateCategory, adminDeleteCategory,
  adminCreatePromotion, adminUpdatePromotion, adminDeletePromotion,
};
