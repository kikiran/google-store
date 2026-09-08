import { ApiError, config, db, logger } from '@nova/shared';
import {
  INVENTORY_SERVICE_URL,
  PAYMENT_SERVICE_URL,
  SHIPPING_SERVICE_URL,
} from '../config.js';
import orderRepository from '../repositories/order.repository.js';
import { pool } from '../db.js';
import { sendNotification } from './notification.client.js';

// Cross-schema pool for READS into nova_product (catalog price re-snapshot + coupon)
const catalogPool = db.createPool(config.dbConfig('DB_PRODUCT_SCHEMA'));

function serviceToken() {
  return process.env.SERVICE_TOKEN || 'nova-internal';
}

async function postTo(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-service-token': serviceToken() },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function getFrom(url) {
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'x-service-token': serviceToken() },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data: data.data ?? data };
}

/**
 * Cross-schema read (READ ONLY): product_variants + products + primary image
 * Reads nova_product.* directly — no writes.
 */
async function getVariantDetails(variantId) {
  const [rows] = await catalogPool.execute(
    `SELECT pv.id, pv.product_id, pv.sku, pv.name, pv.color, pv.color_swatch, pv.storage,
            pv.price, pv.compare_at_price, pv.is_active,
            p.slug, p.name AS product_name, p.id AS product_pk
     FROM product_variants pv
     JOIN products p ON p.id = pv.product_id
     WHERE pv.id = ? AND pv.is_active = 1 AND p.deleted_at IS NULL
     LIMIT 1`,
    [variantId]
  );
  return rows[0] || null;
}

/**
 * Cross-schema read (READ ONLY): primary image for a variant.
 * Reads nova_product.* directly — no writes.
 */
async function getVariantImage(productId, variantId) {
  let [rows] = await catalogPool.execute(
    `SELECT url FROM product_images WHERE variant_id = ? AND is_primary = 1 LIMIT 1`,
    [variantId]
  );
  if (rows.length) return rows[0].url;
  [rows] = await catalogPool.execute(
    `SELECT url FROM product_images WHERE product_id = ? AND is_primary = 1 ORDER BY sort_order ASC LIMIT 1`,
    [productId]
  );
  if (rows.length) return rows[0].url;
  [rows] = await catalogPool.execute(
    `SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC LIMIT 1`,
    [productId]
  );
  return rows[0]?.url || null;
}

/**
 * Cross-schema coupon read + usage write.
 * READ allowed on nova_product.coupons; the used_count increment is an
 * explicitly-allowed cross-schema WRITE (documented here).
 */
async function loadCoupon(couponCode, itemsSubtotal) {
  const [rows] = await catalogPool.execute(
    `SELECT id, code, discount_type, discount_value, max_uses, used_count, min_order_amount, expires_at, is_active
     FROM coupons
     WHERE code = ? AND is_active = 1
     LIMIT 1`,
    [couponCode]
  );
  const coupon = rows[0];
  if (!coupon) return { error: 'COUPON_INVALID' };
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return { error: 'COUPON_EXPIRED' };
  if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses) return { error: 'COUPON_INVALID' };
  if (coupon.min_order_amount != null && itemsSubtotal < Number(coupon.min_order_amount)) return { error: 'COUPON_INVALID' };

  let discount = 0;
  if (coupon.discount_type === 'percent') {
    discount = (itemsSubtotal * Number(coupon.discount_value)) / 100;
  } else {
    discount = Math.min(Number(coupon.discount_value), itemsSubtotal);
  }
  return { coupon, discount: Number(discount.toFixed(2)) };
}

async function incrementCouponUse(couponId) {
  // Cross-schema WRITE to nova_product.coupons used_count — explicitly allowed.
  await catalogPool.execute(`UPDATE coupons SET used_count = used_count + 1 WHERE id = ?`, [couponId]);
}

/**
 * Step 1: validate + price items from the catalog (cross-schema read), compute totals.
 */
async function priceItems(items) {
  const priced = [];
  let itemsSubtotal = 0;
  for (const it of items) {
    const variant = await getVariantDetails(it.variantId);
    if (!variant) {
      throw ApiError.notFound('VARIANT_NOT_FOUND', `Variant ${it.variantId} not found`);
    }
    const image = await getVariantImage(variant.product_id, variant.variant_id || variant.id);
    const unitPrice = Number(variant.price);
    const compareAtPrice = variant.compare_at_price ? Number(variant.compare_at_price) : null;
    const lineTotal = unitPrice * it.quantity;
    itemsSubtotal += lineTotal;
    priced.push({
      variant,
      imageUrl: image,
      quantity: it.quantity,
      unitPrice,
      compareAtPrice,
      lineTotal: Number(lineTotal.toFixed(2)),
    });
  }
  return { priced, itemsSubtotal: Number(itemsSubtotal.toFixed(2)) };
}

/**
 * Step 2: fetch shipping methods, resolve requested method (fallback standard).
 */
async function resolveShipping(deliveryMethod) {
  const res = await getFrom(`${SHIPPING_SERVICE_URL}/api/shipping/methods`);
  if (!res.ok || !Array.isArray(res.data)) {
    throw ApiError.internal('SHIPPING_UNAVAILABLE', 'Unable to load shipping methods');
  }
  const method = res.data.find((m) => m.code === deliveryMethod) || res.data.find((m) => m.code === 'standard');
  if (!method) {
    throw ApiError.badRequest('SHIPPING_METHOD_INVALID', 'Invalid delivery method');
  }
  return method;
}

async function reserveInventory(orderId, items) {
  const payload = { orderId, items: items.map((i) => ({ variantId: i.variant.variant_id || i.variant.id, quantity: i.quantity })) };
  return postTo(`${INVENTORY_SERVICE_URL}/api/inventory/reservations`, payload);
}

async function confirmReservations(orderId) {
  return postTo(`${INVENTORY_SERVICE_URL}/api/inventory/reservations/confirm`, { orderId });
}

async function releaseReservations(orderId) {
  return postTo(`${INVENTORY_SERVICE_URL}/api/inventory/reservations/release`, { orderId });
}

async function chargePayment(payload) {
  return postTo(`${PAYMENT_SERVICE_URL}/api/payments/charge`, payload);
}

async function refundPayment(orderId) {
  return postTo(`${PAYMENT_SERVICE_URL}/api/payments/refund`, { orderId });
}

async function createShipment(order, shippingAddress, deliveryMethod) {
  return postTo(`${SHIPPING_SERVICE_URL}/api/shipping/shipments`, {
    orderId: order.id,
    methodCode: deliveryMethod,
    recipientName: shippingAddress.fullName,
    recipientPhone: shippingAddress.phone,
    address: shippingAddress,
  });
}

/**
 * Post-charge completion path shared by checkout and confirm-payment:
 * set CONFIRMED/PAID, create shipment, confirm reservations, notify.
 */
async function completePayment(order, payment, shippingAddress, deliveryMethod) {
  await orderRepository.updateOrderStatus(null, order.id, 'CONFIRMED', 'PAID');
  await orderRepository.insertStatusEvent(null, order.id, 'PENDING', 'CONFIRMED', 'Payment confirmed', 'SYSTEM', null);

  // a. Create shipment (idempotent in shipping service)
  let shipment = null;
  let trackingNumber = null;
  try {
    const shipRes = await createShipment(order, shippingAddress, deliveryMethod);
    if (shipRes.ok && shipRes.data.data) {
      shipment = shipRes.data.data;
      trackingNumber = shipment.trackingNumber || null;
    } else if (shipRes.ok && shipRes.data) {
      shipment = shipRes.data;
      trackingNumber = shipment.trackingNumber || null;
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'shipment creation failed after payment');
  }

  // b. Confirm inventory reservations
  try {
    await confirmReservations(order.id);
  } catch (err) {
    logger.warn({ err: err.message }, 'reservation confirm failed');
  }

  // c. Notifications
  sendNotification('order_confirmed', {
    email: order.customer_email,
    orderNumber: order.order_number,
    total: order.grand_total,
    summary: order.order_number,
  });
  sendNotification('payment_confirmed', {
    email: order.customer_email,
    orderNumber: order.order_number,
    amount: order.grand_total,
    paymentId: payment?.paymentId || payment?.payment_id || null,
  });

  return { shipment, trackingNumber };
}

function serializeOrder(order, items, events) {
  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    payment_status: order.payment_status,
    customerEmail: order.customer_email,
    customerName: order.customer_name,
    shippingMethodCode: order.shipping_method_code,
    shippingMethodName: order.shipping_method_name,
    itemsSubtotal: Number(order.items_subtotal),
    discountTotal: Number(order.discount_total),
    shippingTotal: Number(order.shipping_total),
    taxTotal: Number(order.tax_total),
    grandTotal: Number(order.grand_total),
    currency: order.currency,
    couponCode: order.coupon_code,
    items: items || undefined,
    statusEvents: events || undefined,
    placedAt: order.placed_at,
  };
}

/**
 * Full checkout orchestration — runs synchronously.
 * NOTE: In production this would fan out onto an event broker (Saga pattern).
 * The places where an async/event-driven handoff would occur are marked inline.
 */
export async function runCheckout(body, userId) {
  const { email, name, shippingAddress, billingAddress, deliveryMethod, couponCode, items, payment } = body;

  // 1. Validate + price items (cross-schema catalog read)
  const { priced, itemsSubtotal } = await priceItems(items);

  // 2. Shipping method
  const shipping = await resolveShipping(deliveryMethod);

  // 3. Coupon
  let discount = 0;
  let couponApplied = null;
  if (couponCode) {
    const couponResult = await loadCoupon(couponCode, itemsSubtotal);
    if (couponResult.error) {
      throw new ApiError(400, couponResult.error, couponResult.error === 'COUPON_EXPIRED' ? 'Coupon has expired' : 'Coupon is invalid');
    }
    discount = couponResult.discount;
    couponApplied = couponResult.coupon;
  }

  const shippingTotal = Number(shipping.fee) || 0;
  const taxTotal = 0;
  const grandTotal = Number((itemsSubtotal - discount + shippingTotal + taxTotal).toFixed(2));

  // 4. Insert order + items in a transaction.
  // order_number is UNIQUE NOT NULL; use a provisional unique value until the
  // real NV-<id> number is assigned below.
  const provisionalNumber = `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const orderId = await db.transaction(pool, async (conn) => {
    const id = await orderRepository.insertOrder({
      order_number: provisionalNumber,
      user_id: userId || null,
      customer_email: email,
      customer_name: name,
      status: 'PENDING',
      shipping_method_code: shipping.code,
      shipping_method_name: shipping.name,
      items_subtotal: itemsSubtotal,
      discount_total: discount,
      shipping_total: shippingTotal,
      tax_total: taxTotal,
      grand_total: grandTotal,
      currency: 'INR',
      coupon_code: couponApplied ? couponApplied.code : null,
      shipping_address: shippingAddress,
      billing_address: billingAddress || shippingAddress,
      notes: null,
      payment_status: 'UNPAID',
    });
    for (const p of priced) {
      await orderRepository.insertOrderItem(conn, {
        product_id: p.variant.product_pk,
        variant_id: p.variant.id,
        product_name: p.variant.product_name,
        variant_name: p.variant.name,
        product_slug: p.variant.slug,
        sku: p.variant.sku,
        image_url: p.imageUrl,
        unit_price: p.unitPrice,
        compare_at_price: p.compareAtPrice,
        quantity: p.quantity,
        line_total: p.lineTotal,
      }, id);
    }
    await orderRepository.insertStatusEvent(conn, id, null, 'PENDING', 'Order placed', 'SYSTEM', null);
    return id;
  });

  // Assign order_number: NV-<100000+id> then update
  const orderNumber = `NV-${String(100000 + orderId)}`;
  await orderRepository.setOrderNumber(orderId, orderNumber);

  let order = await orderRepository.findByOrderNumber(null, orderNumber);

  // 5. Reserve inventory
  const reserveRes = await reserveInventory(orderId, priced);
  if (!reserveRes.ok || (reserveRes.data?.data?.success === false)) {
    // Mark cancelled
    await orderRepository.updateOrderStatus(null, orderId, 'CANCELLED', 'UNPAID');
    await orderRepository.insertStatusEvent(null, orderId, 'PENDING', 'CANCELLED', 'Out of stock', 'SYSTEM', null);
    sendNotification('order_cancelled', { email, orderNumber, reason: 'Out of stock' });
    throw new ApiError(409, 'INSUFFICIENT_STOCK', 'Some items are out of stock');
  }

  // 6. Charge payment
  const chargePayload = {
    orderId,
    amount: grandTotal,
    currency: 'INR',
    method: payment.method,
    card: payment.card,
    upi: payment.upi,
    userId: userId || null,
    email,
  };
  const chargeRes = await chargePayment(chargePayload);
  const paymentObj = chargeRes.data?.data || chargeRes.data || {};
  const paymentStatus = paymentObj.status;

  if (paymentStatus === 'CONFIRMED') {
    const { shipment, trackingNumber } = await completePayment(order, paymentObj, shippingAddress, deliveryMethod);
    order = await orderRepository.findByOrderNumber(null, orderNumber);
    const itemsList = await orderRepository.getOrderItems(orderId);
    const events = await orderRepository.getStatusEvents(orderId);
    return {
      order: serializeOrder(order, itemsList, events),
      payment: paymentObj,
      shipment,
      trackingNumber,
    };
  }

  if (paymentStatus === 'FAILED') {
    const reason = paymentObj.errorReason || 'Payment failed';
    await orderRepository.updateOrderStatus(null, orderId, 'CANCELLED', 'UNPAID');
    await orderRepository.insertStatusEvent(null, orderId, 'PENDING', 'CANCELLED', reason, 'SYSTEM', null);
    // Release reservations
    try {
      await releaseReservations(orderId);
    } catch (err) {
      logger.warn({ err: err.message }, 'reservation release failed after payment failure');
    }
    sendNotification('payment_failed', { email, orderNumber, reason });
    sendNotification('order_cancelled', { email, orderNumber, reason });
    throw new ApiError(402, 'PAYMENT_FAILED', reason);
  }

  // Unexpected status
  throw ApiError.internal('PAYMENT_UNKNOWN', 'Payment returned an unknown status');
}

export default {
  runCheckout,
  completePayment,
  serializeOrder,
};
