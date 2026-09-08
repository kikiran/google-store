import { ApiError, logger } from '@nova/shared';
import {
  INVENTORY_SERVICE_URL,
  PAYMENT_SERVICE_URL,
  SHIPPING_SERVICE_URL,
} from '../config.js';
import orderRepository from '../repositories/order.repository.js';
import orchestrator from './orchestrator.service.js';
import { sendNotification } from './notification.client.js';

function serviceToken() {
  return process.env.SERVICE_TOKEN || 'nova-internal';
}

async function getFrom(url) {
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'x-service-token': serviceToken() },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data: data.data ?? data };
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

async function loadShipmentForOrder(orderId) {
  try {
    const res = await getFrom(`${SHIPPING_SERVICE_URL}/api/shipping/shipments/by-order/${orderId}`);
    if (res.ok && (res.data?.data || res.data)) return res.data.data || res.data;
  } catch (err) {
    logger.warn({ err: err.message }, 'shipment lookup failed');
  }
  return null;
}

const FORWARD_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'SHIPPED', 'CANCELLED'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: ['REFUNDED'],
  REFUNDED: [],
};

export async function listAdminOrders({ status, q, page = 1, limit = 10 }) {
  const offset = (page - 1) * limit;
  const orders = await orderRepository.listAdmin({ status, q, orderBy: 'created_at', orderDir: 'DESC', offset, limit });
  const total = await orderRepository.countAdmin({ status, q });
  const totalPages = Math.ceil(total / limit) || 0;

  const serialized = [];
  for (const o of orders) {
    const items = await orderRepository.getOrderItems(o.id);
    serialized.push({
      ...orchestrator.serializeOrder(o, items),
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
    });
  }

  return { items: serialized, meta: { page, limit, total, totalPages } };
}

/**
 * Admin status transition with forward-only guard + notifications.
 */
export async function updateAdminOrderStatus(id, { status, note }, actor) {
  const order = await orderRepository.findById(null, id);
  if (!order) throw ApiError.notFound('ORDER_NOT_FOUND', 'Order not found');

  // Transition guard
  const allowed = FORWARD_TRANSITIONS[order.status] || [];
  if (!allowed.includes(status)) {
    throw ApiError.conflict('ORDER_NOT_CANCELLABLE', `Cannot transition from ${order.status} to ${status}`);
  }

  // SHIPPED requires a shipment (create via shipping service if none)
  if (status === 'SHIPPED' || status === 'DELIVERED') {
    let shipment = await loadShipmentForOrder(order.id);
    if (!shipment && status === 'SHIPPED') {
      const shippingAddress = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;
      const shipRes = await postTo(`${SHIPPING_SERVICE_URL}/api/shipping/shipments`, {
        orderId: order.id,
        methodCode: order.shipping_method_code || 'standard',
        recipientName: shippingAddress?.fullName || order.customer_name,
        recipientPhone: shippingAddress?.phone || null,
        address: shippingAddress || {},
      });
      if (shipRes.ok) shipment = shipRes.data.data || shipRes.data;
    }
    if (status === 'SHIPPED' && !shipment) {
      throw ApiError.conflict('NO_SHIPMENT', 'Cannot mark shipped without a shipment');
    }
    if (status === 'DELIVERED' && !shipment) {
      throw ApiError.conflict('NO_SHIPMENT', 'Cannot mark delivered without a shipment');
    }
  }

  // Payment status handling
  let paymentStatus = order.payment_status;
  if (status === 'CANCELLED' && order.payment_status === 'PAID') {
    // refund on cancel (if paid)
    try {
      await postTo(`${PAYMENT_SERVICE_URL}/api/payments/refund`, { orderId: order.id });
      paymentStatus = 'REFUNDED';
    } catch (err) {
      logger.warn({ err: err.message }, 'refund failed on admin cancel');
    }
    try {
      await postTo(`${INVENTORY_SERVICE_URL}/api/inventory/reservations/release`, { orderId: order.id });
    } catch (err) {
      logger.warn({ err: err.message }, 'reservation release failed on admin cancel');
    }
  }

  await orderRepository.updateOrderStatus(null, order.id, status, paymentStatus);
  await orderRepository.insertStatusEvent(null, order.id, order.status, status, note || null, 'STAFF', actor?.id || null);

  // Notifications
  if (status === 'SHIPPED') {
    const shipment = await loadShipmentForOrder(order.id);
    sendNotification('order_shipped', {
      email: order.customer_email,
      orderNumber: order.order_number,
      trackingNumber: shipment?.trackingNumber || shipment?.tracking_number || null,
    });
  }
  if (status === 'DELIVERED') {
    sendNotification('order_delivered', {
      email: order.customer_email,
      orderNumber: order.order_number,
    });
  }
  if (status === 'CANCELLED') {
    sendNotification('order_cancelled', {
      email: order.customer_email,
      orderNumber: order.order_number,
      reason: note || 'Cancelled by staff',
    });
  }
  if (status === 'REFUNDED') {
    sendNotification('order_cancelled', {
      email: order.customer_email,
      orderNumber: order.order_number,
      reason: 'Order refunded',
    });
  }

  const updated = await orderRepository.findById(null, order.id);
  const items = await orderRepository.getOrderItems(updated.id);
  const events = await orderRepository.getStatusEvents(updated.id);
  const shipment = await loadShipmentForOrder(updated.id);
  return {
    ...orchestrator.serializeOrder(updated, items, events),
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    shipment,
    tracking: shipment?.trackingNumber || shipment?.tracking_number || null,
  };
}

export default { listAdminOrders, updateAdminOrderStatus };
