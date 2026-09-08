import { ApiError, config, db, generateSessionKey } from '@nova/shared';
import cartRepository from '../repositories/cart.repository.js';

// Pool for cross-schema READS into nova_product (direct DB, allowed per rules)
const productPool = db.createPool(config.dbConfig('DB_PRODUCT_SCHEMA'));
// Pool for cross-schema READS into nova_inventory
const inventoryPool = db.createPool(config.dbConfig('DB_INVENTORY_SCHEMA'));

/**
 * Cross-schema read: product_variants + products + product_images
 * READ ONLY — no writes to nova_product.
 */
async function getVariantDetails(variantId) {
  const [rows] = await productPool.execute(
    `SELECT pv.id, pv.product_id, pv.sku, pv.name, pv.color, pv.color_swatch, pv.storage,
            pv.price, pv.compare_at_price, pv.is_active,
            p.slug, p.name AS product_name
     FROM product_variants pv
     JOIN products p ON p.id = pv.product_id
     WHERE pv.id = ? AND pv.is_active = 1 AND p.deleted_at IS NULL
     LIMIT 1`,
    [variantId]
  );
  return rows[0] || null;
}

/**
 * Cross-schema read: primary image for a variant (or product fallback)
 * READ ONLY — no writes to nova_product.
 */
async function getVariantImage(productId, variantId) {
  // Try variant-specific primary image first
  let [rows] = await productPool.execute(
    `SELECT url, alt_text FROM product_images
     WHERE variant_id = ? AND is_primary = 1 LIMIT 1`,
    [variantId]
  );
  if (rows.length) return rows[0];
  // Fallback to product-level primary image
  [rows] = await productPool.execute(
    `SELECT url, alt_text FROM product_images
     WHERE product_id = ? AND variant_id IS NULL AND is_primary = 1 LIMIT 1`,
    [productId]
  );
  if (rows.length) return rows[0];
  // Fallback to first image for the product
  [rows] = await productPool.execute(
    `SELECT url, alt_text FROM product_images
     WHERE product_id = ? ORDER BY sort_order ASC LIMIT 1`,
    [productId]
  );
  return rows[0] || null;
}

/**
 * Cross-schema read: inventory for a variant
 * READ ONLY — no writes to nova_inventory.
 */
async function getInventory(variantId) {
  const [rows] = await inventoryPool.execute(
    `SELECT quantity, reserved_quantity FROM inventory WHERE variant_id = ? LIMIT 1`,
    [variantId]
  );
  if (!rows.length) return { quantity: 0, reserved_quantity: 0, available: 0, inStock: false };
  const inv = rows[0];
  const available = Math.max(0, inv.quantity - inv.reserved_quantity);
  return { quantity: inv.quantity, reserved_quantity: inv.reserved_quantity, available, inStock: available > 0 };
}

function resolveSessionKey(req) {
  return req.query.sessionKey || req.cookies?.nova_session || null;
}

function resolveUserId(req) {
  return req.headers['x-user-id'] || null;
}

async function resolveOrCreateCart(req) {
  const userId = resolveUserId(req);
  let cart = null;

  if (userId) {
    cart = await cartRepository.findActiveCartByUserId(userId);
    if (!cart) {
      // Check if there's a guest cart to adopt
      const sessionKey = resolveSessionKey(req);
      if (sessionKey) {
        cart = await cartRepository.findActiveCartBySessionKey(sessionKey);
        if (cart) {
          await cartRepository.updateCartUserId(cart.id, userId);
          cart.user_id = userId;
        }
      }
      if (!cart) {
        cart = await cartRepository.createCart({ userId });
      }
    }
  } else {
    let sessionKey = resolveSessionKey(req);
    if (!sessionKey) {
      // Generate a new session key
      sessionKey = generateSessionKey();
    }
    cart = await cartRepository.findActiveCartBySessionKey(sessionKey);
    if (!cart) {
      cart = await cartRepository.createCart({ sessionKey });
    }
  }
  return cart;
}

function computeCartTotals(items) {
  let subtotal = 0;
  let compareAtSubtotal = 0;
  for (const item of items) {
    subtotal += Number(item.unitPrice) * item.quantity;
    if (item.compareAtPrice && Number(item.compareAtPrice) > Number(item.unitPrice)) {
      compareAtSubtotal += Number(item.compareAtPrice) * item.quantity;
    } else {
      compareAtSubtotal += Number(item.unitPrice) * item.quantity;
    }
  }
  const discount = compareAtSubtotal > subtotal ? compareAtSubtotal - subtotal : 0;
  return { subtotal: Number(subtotal.toFixed(2)), compareAtSubtotal: Number(compareAtSubtotal.toFixed(2)), discount: Number(discount.toFixed(2)) };
}

async function enrichCartItems(cartItems) {
  const enriched = [];
  for (const item of cartItems) {
    const variant = await getVariantDetails(item.variant_id);
    if (!variant) continue; // skip stale
    const image = await getVariantImage(variant.product_id, item.variant_id);
    const stock = await getInventory(item.variant_id);
    enriched.push({
      id: item.id,
      variantId: item.variant_id,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      compareAtPrice: item.compare_at_price ? Number(item.compare_at_price) : null,
      product: { slug: variant.slug, name: variant.product_name },
      variant: {
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        color: variant.color,
        colorSwatch: variant.color_swatch,
        storage: variant.storage,
        price: Number(variant.price),
        compareAtPrice: variant.compare_at_price ? Number(variant.compare_at_price) : null,
        imageUrl: image?.url || null,
      },
      stock: { available: stock.available, quantity: stock.quantity, inStock: stock.inStock },
    });
  }
  return enriched;
}

export async function getCart(req) {
  const cart = await resolveOrCreateCart(req);
  const items = await cartRepository.getCartItems(cart.id);
  const enrichedItems = await enrichCartItems(items);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const totals = computeCartTotals(enrichedItems);
  return { id: cart.id, count, items: enrichedItems, ...totals };
}

export async function addItem(req, { variantId, quantity }) {
  const cart = await resolveOrCreateCart(req);

  // Cross-schema read: validate variant exists & active
  const variant = await getVariantDetails(variantId);
  if (!variant) throw ApiError.notFound('VARIANT_NOT_FOUND', 'Product variant not found');

  // Cross-schema read: stock check
  const stock = await getInventory(variantId);
  const existingItem = await cartRepository.findCartItemByVariant(cart.id, variantId);
  const currentQty = existingItem ? existingItem.quantity : 0;

  if (stock.available === 0 && !existingItem) {
    throw ApiError.conflict('OUT_OF_STOCK', 'This item is out of stock');
  }
  const requestedTotal = currentQty + quantity;
  if (requestedTotal > stock.available) {
    throw ApiError.badRequest('INSUFFICIENT_STOCK', `Only ${stock.available} items available`);
  }

  // Price snapshot from catalog
  const unitPrice = Number(variant.price);
  const compareAtPrice = variant.compare_at_price ? Number(variant.compare_at_price) : null;

  await cartRepository.upsertCartItem(cart.id, variantId, quantity, unitPrice, compareAtPrice);
  return getCart(req);
}

export async function updateItem(req, itemId, { quantity }) {
  const cart = await resolveOrCreateCart(req);
  const item = await cartRepository.findCartItemById(cart.id, itemId);
  if (!item) throw ApiError.notFound('CART_ITEM_NOT_FOUND', 'Cart item not found');

  // Stock check for new quantity
  const stock = await getInventory(item.variant_id);
  const otherQty = item.quantity; // current qty of THIS item
  // Allow if requested qty <= available + current (to avoid double-counting)
  if (quantity > stock.available + otherQty) {
    throw ApiError.badRequest('INSUFFICIENT_STOCK', `Only ${stock.available} items available`);
  }

  await cartRepository.setCartItemQuantity(cart.id, itemId, quantity);
  return getCart(req);
}

export async function removeItem(req, itemId) {
  const cart = await resolveOrCreateCart(req);
  const item = await cartRepository.findCartItemById(cart.id, itemId);
  if (!item) throw ApiError.notFound('CART_ITEM_NOT_FOUND', 'Cart item not found');
  await cartRepository.removeCartItem(cart.id, itemId);
  return getCart(req);
}

export async function clearCart(req) {
  const cart = await resolveOrCreateCart(req);
  await cartRepository.clearCart(cart.id);
  return getCart(req);
}

export async function mergeGuestCart(req, guestSessionKey) {
  const userCart = await resolveOrCreateCart(req);
  const userId = resolveUserId(req);
  if (!userId) throw ApiError.unauthorized('UNAUTHENTICATED', 'Authentication required');

  const guestCart = await cartRepository.findActiveCartBySessionKey(guestSessionKey);
  if (!guestCart) return getCart(req); // nothing to merge

  const guestItems = await cartRepository.getCartItems(guestCart.id);

  for (const gItem of guestItems) {
    const variant = await getVariantDetails(gItem.variant_id);
    if (!variant) continue; // skip invalid variants

    const stock = await getInventory(gItem.variant_id);
    const existingItem = await cartRepository.findCartItemByVariant(userCart.id, gItem.variant_id);
    const currentQty = existingItem ? existingItem.quantity : 0;
    let mergeQty = Math.min(gItem.quantity, 10 - currentQty); // cap at 10
    if (mergeQty <= 0) continue;

    const requestedTotal = currentQty + mergeQty;
    if (stock.available === 0) continue; // skip out-of-stock
    if (requestedTotal > stock.available) {
      mergeQty = Math.max(0, stock.available - currentQty);
      if (mergeQty <= 0) continue;
    }

    const unitPrice = Number(variant.price);
    const compareAtPrice = variant.compare_at_price ? Number(variant.compare_at_price) : null;

    if (existingItem) {
      await cartRepository.setCartItemQuantity(userCart.id, existingItem.id, currentQty + mergeQty);
    } else {
      await cartRepository.upsertCartItem(userCart.id, gItem.variant_id, mergeQty, unitPrice, compareAtPrice);
    }
  }

  // Clear guest cart
  await cartRepository.clearCart(guestCart.id);
  return getCart(req);
}

export async function getCount(req) {
  const cart = await resolveOrCreateCart(req);
  const count = await cartRepository.getCartItemCount(cart.id);
  return { count };
}

export default { getCart, addItem, updateItem, removeItem, clearCart, mergeGuestCart, getCount };
