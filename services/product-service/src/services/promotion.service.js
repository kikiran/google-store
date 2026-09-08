import { ApiError } from '@nova/shared';
import promotionRepository from '../repositories/promotion.repository.js';
import productRepository from '../repositories/product.repository.js';

export async function listActivePromotions() {
  const promotions = await productRepository.findActivePromotions();
  const result = [];
  for (const pr of promotions) {
    const productIds = await productRepository.findPromotionProducts(pr.id);
    result.push({
      id: String(pr.id),
      name: pr.name,
      slug: pr.slug,
      description: pr.description,
      discountType: pr.discount_type,
      discountValue: Number(pr.discount_value),
      startsAt: pr.starts_at,
      endsAt: pr.ends_at,
      isActive: !!pr.is_active,
      productIds: productIds.map(String),
    });
  }
  return result;
}

export async function createPromotion(data) {
  if (await promotionRepository.slugExists(data.slug)) {
    throw ApiError.conflict('DUPLICATE_RESOURCE', 'A promotion with this slug already exists');
  }
  const promo = await promotionRepository.create(data);
  if (data.productIds && data.productIds.length > 0) {
    await promotionRepository.replaceProducts(promo.id, data.productIds);
  }
  return { ...promo, productIds: data.productIds || [] };
}

export async function updatePromotion(id, data) {
  const existing = await promotionRepository.findById(id);
  if (!existing) throw ApiError.notFound('NOT_FOUND', 'Promotion not found');
  if (data.slug && data.slug !== existing.slug) {
    if (await promotionRepository.slugExists(data.slug, id)) {
      throw ApiError.conflict('DUPLICATE_RESOURCE', 'A promotion with this slug already exists');
    }
  }
  const updated = await promotionRepository.update(id, data);
  if (data.productIds !== undefined) {
    await promotionRepository.replaceProducts(id, data.productIds);
  }
  const productIds = await productRepository.findPromotionProducts(id);
  return { ...updated, productIds: productIds.map(String) };
}

export async function deletePromotion(id) {
  const existing = await promotionRepository.findById(id);
  if (!existing) throw ApiError.notFound('NOT_FOUND', 'Promotion not found');
  await promotionRepository.remove(id);
}

export default { listActivePromotions, createPromotion, updatePromotion, deletePromotion };
