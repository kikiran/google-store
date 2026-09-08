import { z } from 'zod';

export const listProductsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(48).default(24),
    category: z.string().optional(),
    q: z.string().optional(),
    sort: z.enum(['featured', 'price_asc', 'price_desc', 'newest', 'rating', 'popular']).default('featured'),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    ratings: z.coerce.number().int().min(1).max(5).optional(),
    availability: z.enum(['in_stock', 'out_of_stock']).optional(),
  }),
});

export const productSlugParams = z.object({
  params: z.object({ slug: z.string().min(1) }),
});

export const productIdParams = z.object({
  params: z.object({ id: z.coerce.number().int().min(1) }),
});

export const createProductSchema = z.object({
  body: z.object({
    slug: z.string().min(1).max(150),
    name: z.string().min(1).max(200),
    tagline: z.string().max(300).optional(),
    description: z.string().optional(),
    brand: z.string().max(100).default('Nova'),
    categoryId: z.coerce.number().int().min(1),
    basePrice: z.coerce.number().min(0),
    compareAtPrice: z.coerce.number().min(0).optional(),
    badge: z.string().max(50).optional(),
    isFeatured: z.coerce.boolean().default(false),
    isNew: z.coerce.boolean().default(false),
    status: z.enum(['draft', 'active', 'archived']).default('draft'),
    featureRank: z.coerce.number().int().default(0),
    metaTitle: z.string().max(200).optional(),
    metaDescription: z.string().max(400).optional(),
    variants: z.array(z.object({
      sku: z.string().min(1).max(80),
      name: z.string().min(1).max(150),
      color: z.string().max(60).optional(),
      colorSwatch: z.string().max(7).optional(),
      storage: z.string().max(30).optional(),
      price: z.coerce.number().min(0),
      compareAtPrice: z.coerce.number().min(0).optional(),
      isDefault: z.coerce.boolean().default(false),
      isActive: z.coerce.boolean().default(true),
    })).min(1),
    images: z.array(z.object({
      url: z.string().min(1).max(500),
      altText: z.string().max(300).optional(),
      isPrimary: z.coerce.boolean().default(false),
      sortOrder: z.coerce.number().int().default(0),
    })).optional(),
    specifications: z.array(z.object({
      name: z.string().min(1).max(120),
      value: z.string().min(1).max(500),
      sortOrder: z.coerce.number().int().default(0),
    })).optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({ id: z.coerce.number().int().min(1) }),
  body: z.object({
    slug: z.string().min(1).max(150).optional(),
    name: z.string().min(1).max(200).optional(),
    tagline: z.string().max(300).optional(),
    description: z.string().optional(),
    brand: z.string().max(100).optional(),
    categoryId: z.coerce.number().int().min(1).optional(),
    basePrice: z.coerce.number().min(0).optional(),
    compareAtPrice: z.coerce.number().min(0).optional().nullable(),
    badge: z.string().max(50).optional().nullable(),
    isFeatured: z.coerce.boolean().optional(),
    isNew: z.coerce.boolean().optional(),
    status: z.enum(['draft', 'active', 'archived']).optional(),
    featureRank: z.coerce.number().int().optional(),
    metaTitle: z.string().max(200).optional().nullable(),
    metaDescription: z.string().max(400).optional().nullable(),
    variants: z.array(z.object({
      id: z.coerce.number().int().optional(),
      sku: z.string().min(1).max(80),
      name: z.string().min(1).max(150),
      color: z.string().max(60).optional(),
      colorSwatch: z.string().max(7).optional(),
      storage: z.string().max(30).optional(),
      price: z.coerce.number().min(0),
      compareAtPrice: z.coerce.number().min(0).optional().nullable(),
      isDefault: z.coerce.boolean().default(false),
      isActive: z.coerce.boolean().default(true),
    })).optional(),
    images: z.array(z.object({
      id: z.coerce.number().int().optional(),
      url: z.string().min(1).max(500),
      altText: z.string().max(300).optional(),
      isPrimary: z.coerce.boolean().default(false),
      sortOrder: z.coerce.number().int().default(0),
    })).optional(),
    specifications: z.array(z.object({
      id: z.coerce.number().int().optional(),
      name: z.string().min(1).max(120),
      value: z.string().min(1).max(500),
      sortOrder: z.coerce.number().int().default(0),
    })).optional(),
  }),
});

export const categorySlugParams = z.object({
  params: z.object({ slug: z.string().min(1) }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(48).default(24),
    sort: z.enum(['featured', 'price_asc', 'price_desc', 'newest', 'rating', 'popular']).default('featured'),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    ratings: z.coerce.number().int().min(1).max(5).optional(),
    availability: z.enum(['in_stock', 'out_of_stock']).optional(),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    slug: z.string().min(1).max(100),
    name: z.string().min(1).max(120),
    description: z.string().max(500).optional(),
    parentId: z.coerce.number().int().min(1).optional(),
    imageUrl: z.string().max(500).optional(),
    icon: z.string().max(50).optional(),
    sortOrder: z.coerce.number().int().default(0),
    isActive: z.coerce.boolean().default(true),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({ id: z.coerce.number().int().min(1) }),
  body: z.object({
    slug: z.string().min(1).max(100).optional(),
    name: z.string().min(1).max(120).optional(),
    description: z.string().max(500).optional().nullable(),
    parentId: z.coerce.number().int().min(1).optional().nullable(),
    imageUrl: z.string().max(500).optional().nullable(),
    icon: z.string().max(50).optional().nullable(),
    sortOrder: z.coerce.number().int().optional(),
    isActive: z.coerce.boolean().optional(),
  }),
});

export const idParams = z.object({
  params: z.object({ id: z.coerce.number().int().min(1) }),
});

export const createPromotionSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(150),
    slug: z.string().min(1).max(120),
    description: z.string().max(500).optional(),
    discountType: z.enum(['percent', 'fixed']),
    discountValue: z.coerce.number().min(0),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime().optional(),
    isActive: z.coerce.boolean().default(true),
    productIds: z.array(z.coerce.number().int().min(1)).optional(),
  }),
});

export const updatePromotionSchema = z.object({
  params: z.object({ id: z.coerce.number().int().min(1) }),
  body: z.object({
    name: z.string().min(1).max(150).optional(),
    slug: z.string().min(1).max(120).optional(),
    description: z.string().max(500).optional().nullable(),
    discountType: z.enum(['percent', 'fixed']).optional(),
    discountValue: z.coerce.number().min(0).optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional().nullable(),
    isActive: z.coerce.boolean().optional(),
    productIds: z.array(z.coerce.number().int().min(1)).optional(),
  }),
});

export default {
  listProductsSchema,
  productSlugParams,
  productIdParams,
  createProductSchema,
  updateProductSchema,
  categorySlugParams,
  createCategorySchema,
  updateCategorySchema,
  idParams,
  createPromotionSchema,
  updatePromotionSchema,
};
