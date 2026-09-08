import { asyncHandler, success } from '@nova/shared';
import productService from '../services/product.service.js';
import categoryService from '../services/category.service.js';
import promotionService from '../services/promotion.service.js';

export const listProducts = asyncHandler(async (req, res) => {
  const result = await productService.listProducts(req.query);
  success(res, result.products, 'Products retrieved', result.meta);
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProductDetail(req.params.slug);
  success(res, product, 'Product retrieved');
});

export const getRelatedProducts = asyncHandler(async (req, res) => {
  const products = await productService.getRelatedProducts(req.params.id, Number(req.query.limit) || 8);
  success(res, products, 'Related products retrieved');
});

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.listActiveCategories();
  success(res, categories, 'Categories retrieved');
});

export const getCategory = asyncHandler(async (req, res) => {
  const result = await categoryService.getCategoryBySlug(req.params.slug, req.query);
  success(res, { category: result.category, products: result.products }, 'Category retrieved', result.meta);
});

export const listPromotions = asyncHandler(async (req, res) => {
  const promotions = await promotionService.listActivePromotions();
  success(res, promotions, 'Promotions retrieved');
});

export default { listProducts, getProduct, getRelatedProducts, listCategories, getCategory, listPromotions };
