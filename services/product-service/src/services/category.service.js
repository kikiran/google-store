import { ApiError } from '@nova/shared';
import categoryRepository from '../repositories/category.repository.js';

export async function listActiveCategories() {
  return categoryRepository.findActiveAll();
}

export async function getCategoryBySlug(slug, filters) {
  const category = await categoryRepository.findActiveBySlug(slug);
  if (!category) throw ApiError.notFound('NOT_FOUND', 'Category not found');

  const productRepository = (await import('../repositories/product.repository.js')).default;
  const { rows, total } = await productRepository.list({ ...filters, category: slug });

  return {
    category: {
      id: String(category.id),
      slug: category.slug,
      name: category.name,
      description: category.description,
      imageUrl: category.image_url,
      icon: category.icon,
    },
    products: rows,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function createCategory(data) {
  const existing = await categoryRepository.findActiveBySlug(data.slug);
  if (existing) throw ApiError.conflict('DUPLICATE_RESOURCE', 'A category with this slug already exists');
  return categoryRepository.create(data);
}

export async function updateCategory(id, data) {
  const existing = await categoryRepository.findById(id);
  if (!existing) throw ApiError.notFound('NOT_FOUND', 'Category not found');
  if (data.slug && data.slug !== existing.slug) {
    const dup = await categoryRepository.findActiveBySlug(data.slug);
    if (dup) throw ApiError.conflict('DUPLICATE_RESOURCE', 'A category with this slug already exists');
  }
  return categoryRepository.update(id, data);
}

export async function deleteCategory(id) {
  const existing = await categoryRepository.findById(id);
  if (!existing) throw ApiError.notFound('NOT_FOUND', 'Category not found');
  const count = await categoryRepository.countProducts(id);
  if (count > 0) {
    throw ApiError.conflict('CONFLICT', 'Cannot delete category with existing products');
  }
  await categoryRepository.remove(id);
}

export default { listActiveCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory };
