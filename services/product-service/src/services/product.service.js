import { ApiError } from '@nova/shared';
import productRepository from '../repositories/product.repository.js';

function formatProduct(row) {
  return {
    id: String(row.id),
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    brand: row.brand,
    badge: row.badge,
    isNew: !!row.isNew,
    isFeatured: !!row.isFeatured,
    category: {
      id: String(row.categoryId),
      slug: row.categorySlug,
      name: row.categoryName,
    },
    basePrice: Number(row.basePrice),
    compareAtPrice: row.compareAtPrice ? Number(row.compareAtPrice) : null,
    images: row.imageUrl ? [{ url: row.imageUrl, alt: row.imageAlt || '' }] : [],
    rating: Number(row.avgRating) || 0,
    reviewCount: Number(row.reviewCount) || 0,
    stock: {
      available: Number(row.stockAvailable) || 0,
      quantity: Number(row.stockQuantity) || 0,
      inStock: (Number(row.stockAvailable) || 0) > 0,
    },
  };
}

function formatProductDetail(row, variants, images, specifications, promotions, ratingSummary, related) {
  const product = {
    id: String(row.id),
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    brand: row.brand,
    badge: row.badge,
    isNew: !!row.is_new,
    isFeatured: !!row.is_featured,
    category: row.category || null,
    basePrice: Number(row.base_price),
    compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : null,
    status: row.status,
    featureRank: row.feature_rank,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    images: images.map((img) => ({
      id: String(img.id),
      url: img.url,
      alt: img.alt_text || '',
      isPrimary: !!img.is_primary,
      sortOrder: img.sort_order,
    })),
    variants: variants.map((v) => ({
      id: String(v.id),
      sku: v.sku,
      name: v.name,
      color: v.color,
      colorSwatch: v.color_swatch,
      storage: v.storage,
      price: Number(v.price),
      compareAtPrice: v.compare_at_price ? Number(v.compare_at_price) : null,
      isDefault: !!v.is_default,
      isActive: !!v.is_active,
      stock: v._stock || { quantity: 0, reservedQuantity: 0, available: 0, inStock: false },
    })),
    specifications: specifications.map((s) => ({
      name: s.name,
      value: s.value,
      sortOrder: s.sort_order,
    })),
    promotions: promotions.map((pr) => {
      let discount = 0;
      if (pr.discount_type === 'percent') {
        discount = Number(row.base_price) * (1 - Number(pr.discount_value) / 100);
      } else {
        discount = Number(row.base_price) - Number(pr.discount_value);
      }
      return {
        id: String(pr.id),
        name: pr.name,
        slug: pr.slug,
        discountType: pr.discount_type,
        discountValue: Number(pr.discount_value),
        promoLabel: `${pr.discount_type === 'percent' ? pr.discount_value + '% off' : '₹' + pr.discount_value + ' off'} — ${pr.name}`,
      };
    }),
    rating: ratingSummary,
    related,
  };
  return product;
}

export async function listProducts(filters) {
  const { rows, total } = await productRepository.list(filters);
  const products = rows.map(formatProduct);
  return {
    products,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function getProductDetail(slugOrId) {
  const product = await productRepository.findBySlugOrId(slugOrId);
  if (!product) throw ApiError.notFound('PRODUCT_NOT_FOUND', 'Product not found');

  const categoryRepository = (await import('../repositories/category.repository.js')).default;
  const category = await categoryRepository.findById(product.category_id);
  if (category) {
    product.category = {
      id: String(category.id),
      slug: category.slug,
      name: category.name,
    };
  }

  const variants = await productRepository.findVariants(product.id);
  const images = await productRepository.findImages(product.id);
  const specifications = await productRepository.findSpecifications(product.id);
  const promotions = await productRepository.findPromotions(product.id);

  // Attach stock to each variant
  for (const v of variants) {
    v._stock = await productRepository.getVariantStock(v.id);
  }

  const ratingSummary = await productRepository.getRatingSummary(product.id);
  const related = await productRepository.findRelatedProducts(product.id, product.category_id, 6);

  return formatProductDetail(product, variants, images, specifications, promotions, ratingSummary, related.map(formatProduct));
}

export async function getRelatedProducts(productId, limit = 8) {
  const product = await productRepository.findById(productId);
  if (!product) throw ApiError.notFound('PRODUCT_NOT_FOUND', 'Product not found');
  const related = await productRepository.findRelatedProducts(product.id, product.category_id, limit);
  return related.map(formatProduct);
}

export async function createProduct(data) {
  if (await productRepository.slugExists(data.slug)) {
    throw ApiError.conflict('DUPLICATE_RESOURCE', 'A product with this slug already exists');
  }
  const product = await productRepository.create(data);

  // Create variants + images + specs + inventory in a transaction
  const { db } = await import('@nova/shared');
  const { pool } = await import('../db.js');

  await db.transaction(pool, async (conn) => {
    // Create variants
    for (const v of data.variants) {
      const [result] = await conn.execute(
        `INSERT INTO product_variants (product_id, sku, name, color, color_swatch, storage, price, compare_at_price, is_default, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [product.id, v.sku, v.name, v.color || null, v.colorSwatch || null, v.storage || null,
         v.price, v.compareAtPrice || null, v.isDefault ? 1 : 0, v.isActive ? 1 : 0]
      );
      // Bootstrap inventory row for each variant
      await conn.execute(
        `INSERT INTO nova_inventory.inventory (variant_id, quantity, reserved_quantity, low_stock_threshold)
         VALUES (?, 0, 0, 5)
         ON DUPLICATE KEY UPDATE quantity = quantity`,
        [result.insertId]
      );
    }

    // Create images
    if (data.images && data.images.length > 0) {
      for (const img of data.images) {
        await conn.execute(
          `INSERT INTO product_images (product_id, url, alt_text, is_primary, sort_order)
           VALUES (?, ?, ?, ?, ?)`,
          [product.id, img.url, img.altText || null, img.isPrimary ? 1 : 0, img.sortOrder || 0]
        );
      }
    }

    // Create specifications
    if (data.specifications && data.specifications.length > 0) {
      for (const spec of data.specifications) {
        await conn.execute(
          `INSERT INTO product_specifications (product_id, name, value, sort_order)
           VALUES (?, ?, ?, ?)`,
          [product.id, spec.name, spec.value, spec.sortOrder || 0]
        );
      }
    }
  });

  return getProductDetail(product.slug);
}

export async function updateProduct(id, data) {
  const existing = await productRepository.findById(id);
  if (!existing) throw ApiError.notFound('PRODUCT_NOT_FOUND', 'Product not found');

  if (data.slug && data.slug !== existing.slug) {
    if (await productRepository.slugExists(data.slug, id)) {
      throw ApiError.conflict('DUPLICATE_RESOURCE', 'A product with this slug already exists');
    }
  }

  const { db } = await import('@nova/shared');
  const { pool } = await import('../db.js');

  await db.transaction(pool, async (conn) => {
    // Update product fields
    const productFields = {};
    for (const [key, val] of Object.entries(data)) {
      if (['variants', 'images', 'specifications'].includes(key)) continue;
      productFields[key] = val;
    }
    if (Object.keys(productFields).length > 0) {
      await productRepository.update(id, productFields);
    }

    // Replace variants if provided
    if (data.variants !== undefined) {
      if (data.variants.length === 0) {
        throw ApiError.badRequest('VALIDATION_ERROR', 'At least one variant is required');
      }
      // Get existing variant IDs
      const existingVariants = await productRepository.findVariants(id);
      const existingIds = new Set(existingVariants.map((v) => v.id));
      const incomingIds = new Set(data.variants.filter((v) => v.id).map((v) => v.id));

      // Delete removed variants
      for (const v of existingVariants) {
        if (!incomingIds.has(v.id)) {
          await conn.execute('DELETE FROM product_variants WHERE id = ?', [v.id]);
          await conn.execute('DELETE FROM nova_inventory.inventory WHERE variant_id = ?', [v.id]);
        }
      }

      // Upsert incoming variants
      for (const v of data.variants) {
        if (v.id && existingIds.has(v.id)) {
          await conn.execute(
            `UPDATE product_variants SET sku = ?, name = ?, color = ?, color_swatch = ?, storage = ?,
             price = ?, compare_at_price = ?, is_default = ?, is_active = ? WHERE id = ?`,
            [v.sku, v.name, v.color || null, v.colorSwatch || null, v.storage || null,
             v.price, v.compareAtPrice || null, v.isDefault ? 1 : 0, v.isActive ? 1 : 0, v.id]
          );
        } else {
          const [result] = await conn.execute(
            `INSERT INTO product_variants (product_id, sku, name, color, color_swatch, storage, price, compare_at_price, is_default, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, v.sku, v.name, v.color || null, v.colorSwatch || null, v.storage || null,
             v.price, v.compareAtPrice || null, v.isDefault ? 1 : 0, v.isActive ? 1 : 0]
          );
          // Bootstrap inventory for new variant
          await conn.execute(
            `INSERT INTO nova_inventory.inventory (variant_id, quantity, reserved_quantity, low_stock_threshold)
             VALUES (?, 0, 0, 5)
             ON DUPLICATE KEY UPDATE quantity = quantity`,
            [result.insertId]
          );
        }
      }
    }

    // Replace images if provided
    if (data.images !== undefined) {
      await conn.execute('DELETE FROM product_images WHERE product_id = ?', [id]);
      for (const img of data.images) {
        await conn.execute(
          `INSERT INTO product_images (product_id, url, alt_text, is_primary, sort_order)
           VALUES (?, ?, ?, ?, ?)`,
          [id, img.url, img.altText || null, img.isPrimary ? 1 : 0, img.sortOrder || 0]
        );
      }
    }

    // Replace specifications if provided
    if (data.specifications !== undefined) {
      await conn.execute('DELETE FROM product_specifications WHERE product_id = ?', [id]);
      for (const spec of data.specifications) {
        await conn.execute(
          `INSERT INTO product_specifications (product_id, name, value, sort_order)
           VALUES (?, ?, ?, ?)`,
          [id, spec.name, spec.value, spec.sortOrder || 0]
        );
      }
    }
  });

  return getProductDetail(existing.slug);
}

export async function deleteProduct(id) {
  const existing = await productRepository.findById(id);
  if (!existing) throw ApiError.notFound('PRODUCT_NOT_FOUND', 'Product not found');
  await productRepository.softDelete(id);
}

export async function adminListProducts(filters) {
  const { rows, total } = await productRepository.adminList(filters);
  return {
    products: rows.map((r) => ({
      id: String(r.id),
      slug: r.slug,
      name: r.name,
      brand: r.brand,
      status: r.status,
      isFeatured: !!r.isFeatured,
      isNew: !!r.isNew,
      basePrice: Number(r.basePrice),
      featureRank: r.featureRank,
      categoryName: r.categoryName,
      variantCount: r.variantCount,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function adminGetProduct(id) {
  const product = await productRepository.findById(id);
  if (!product) throw ApiError.notFound('PRODUCT_NOT_FOUND', 'Product not found');
  return getProductDetail(product.slug);
}

export default {
  listProducts, getProductDetail, getRelatedProducts, createProduct, updateProduct, deleteProduct,
  adminListProducts, adminGetProduct,
};
