import { ApiError, db, logger } from '@nova/shared';
import {
  INVENTORY_SERVICE_URL,
  PAYMENT_SERVICE_URL,
  SHIPPING_SERVICE_URL,
} from '../config.js';
import orderRepository from '../repositories/order.repository.js';
import orchestrator from './orchestrator.service.js';
import { sendNotification } from './notification.client.js';
import { pool } from '../db.js';

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

export async function createOrder(body, userId) {
  return orchestrator.runCheckout(body, userId);
}

async function loadShipmentForOrder(orderId) {
  try {
    const res = await getFrom(`${SHIPPING_SERVICE_URL}/api/shipping/shipments/by-order/${orderId}`);
    if (res.ok && (res.data?.data || res.data)) {
      return res.data.data || res.data;
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'shipment lookup failed');
  }
  return null;
}

async function loadPaymentForOrder(orderId) {
  try {
    const res = await getFrom(`${PAYMENT_SERVICE_URL}/api/payments/${orderId}`);
    if (res.ok && (res.data?.data || res.data)) {
      return res.data.data || res.data;
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'payment lookup failed');
  }
  return null;
}

function resolveAccess(req, order) {
  // Order belongs to a user
  if (order.user_id) {
    const user = req.user;
    if (!user) return false;
    if (String(order.user_id) === String(user.id)) return true;
    if (req.headers['x-user-role'] === 'ADMIN') return true;
    return false;
  }
  // Guest order — allow with matching ?email=
  const email = req.query.email;
  if (email && String(email).toLowerCase() === String(order.customer_email).toLowerCase()) return true;
  return false;
}

export async function getOrderDetail(req, orderNumber) {
  const order = await orderRepository.findByOrderNumber(null, orderNumber);
  if (!order) throw ApiError.notFound('ORDER_NOT_FOUND', 'Order not found');

  if (order.user_id && !resolveAccess(req, order)) {
    throw ApiError.notFound('ORDER_NOT_FOUND', 'Order not found');
  }
  if (!order.user_id) {
    const email = req.query.email;
    if (!email || String(email).toLowerCase() !== String(order.customer_email).toLowerCase()) {
      throw ApiError.notFound('ORDER_NOT_FOUND', 'Order not found');
    }
  }

  const items = await orderRepository.getOrderItems(order.id);
  const events = await orderRepository.getStatusEvents(order.id);
  const shipment = await loadShipmentForOrder(order.id);
  const payment = await loadPaymentForOrder(order.id);

  return {
    ...orchestrator.serializeOrder(order, items, events),
    payment,
    shipment,
    tracking: shipment?.trackingNumber || shipment?.tracking_number || null,
  };
}

function canCancel(order) {
  return ['PENDING', 'CONFIRMED'].includes(order.status);
}

export async function cancelOrder(req, orderNumber) {
  const order = await orderRepository.findByOrderNumber(null, orderNumber);
  if (!order) throw ApiError.notFound('ORDER_NOT_FOUND', 'Order not found');

  // Access control (owner or ADMIN)
  if (order.user_id) {
    const user = req.user;
    if (!user) throw ApiError.unauthorized('UNAUTHENTICATED', 'Authentication required');
    const isOwner = String(order.user_id) === String(user.id);
    const isAdmin = req.headers['x-user-role'] === 'ADMIN';
    if (!isOwner && !isAdmin) throw ApiError.notFound('ORDER_NOT_FOUND', 'Order not found');
  } else {
    const email = req.query.email;
    if (!email || String(email).toLowerCase() !== String(order.customer_email).toLowerCase()) {
      throw ApiError.notFound('ORDER_NOT_FOUND', 'Order not found');
    }
  }

  if (!canCancel(order)) throw ApiError.conflict('ORDER_NOT_CANCELLABLE', 'This order cannot be cancelled');

  // Orchestration: cancel + release reservations + refund
  await orderRepository.updateOrderStatus(null, order.id, 'CANCELLED', 'REFUNDED');
  await orderRepository.insertStatusEvent(null, order.id, order.status, 'CANCELLED', 'Cancelled by customer', 'CUSTOMER', req.user?.id || null);

  try {
    await postTo(`${INVENTORY_SERVICE_URL}/api/inventory/reservations/release`, { orderId: order.id });
  } catch (err) {
    logger.warn({ err: err.message }, 'reservation release failed during cancel');
  }

  try {
    await postTo(`${PAYMENT_SERVICE_URL}/api/payments/refund`, { orderId: order.id });
  } catch (err) {
    logger.warn({ err: err.message }, 'refund failed during cancel');
  }

  sendNotification('order_cancelled', {
    email: order.customer_email,
    orderNumber: order.order_number,
    reason: 'Cancelled by customer',
  });

  const updated = await orderRepository.findByOrderNumber(null, orderNumber);
  const items = await orderRepository.getOrderItems(updated.id);
  const events = await orderRepository.getStatusEvents(updated.id);
  const shipment = await loadShipmentForOrder(updated.id);
  return {
    ...orchestrator.serializeOrder(updated, items, events),
    shipment,
    tracking: shipment?.trackingNumber || shipment?.tracking_number || null,
  };
}

function orderCanBePaid(order) {
  return ['PENDING'].includes(order.status) && order.payment_status === 'UNPAID';
}

export async function confirmPayment(req, orderNumber) {
  const order = await orderRepository.findByOrderNumber(null, orderNumber);
  if (!order) throw ApiError.notFound('ORDER_NOT_FOUND', 'Order not found');

  // Access control (owner or admin)
  if (order.user_id) {
    const user = req.user;
    if (!user) throw ApiError.unauthorized('UNAUTHENTICATED', 'Authentication required');
    const isOwner = String(order.user_id) === String(user.id);
    const isAdmin = req.headers['x-user-role'] === 'ADMIN';
    if (!isOwner && !isAdmin) throw ApiError.notFound('ORDER_NOT_FOUND', 'Order not found');
  } else {
    const email = req.query.email;
    if (!email || String(email).toLowerCase() !== String(order.customer_email).toLowerCase()) {
      throw ApiError.notFound('ORDER_NOT_FOUND', 'Order not found');
    }
  }

  if (!orderCanBePaid(order)) {
    // If already confirmed, return current state
    if (order.status === 'CONFIRMED' && order.payment_status === 'PAID') {
      const items = await orderRepository.getOrderItems(order.id);
      const events = await orderRepository.getStatusEvents(order.id);
      return orchestrator.serializeOrder(order, items, events);
    }
    throw ApiError.conflict('ORDER_NOT_CANCELLABLE', 'Payment cannot be confirmed for this order');
  }

  // Retry charge using the stored address
  const shippingAddress = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;

  const chargePayload = {
    orderId: order.id,
    amount: Number(order.grand_total),
    currency: order.currency || 'INR',
    method: 'mock',
    userId: order.user_id || null,
    email: order.customer_email,
  };
  const chargeRes = await postTo(`${PAYMENT_SERVICE_URL}/api/payments/charge`, chargePayload);
  const paymentObj = chargeRes.data?.data || chargeRes.data || {};
  const paymentStatus = paymentObj.status;

  if (paymentStatus === 'CONFIRMED') {
    const { shipment, trackingNumber } = await orchestrator.completePayment(order, paymentObj, shippingAddress, order.shipping_method_code || 'standard');
    const updated = await orderRepository.findByOrderNumber(null, orderNumber);
    const items = await orderRepository.getOrderItems(updated.id);
    const events = await orderRepository.getStatusEvents(updated.id);
    return {
      ...orchestrator.serializeOrder(updated, items, events),
      payment: paymentObj,
      shipment,
      trackingNumber,
    };
  }

  if (paymentStatus === 'FAILED') {
    const reason = paymentObj.errorReason || 'Payment failed';
    throw new ApiError(402, 'PAYMENT_FAILED', reason);
  }

  throw ApiError.internal('PAYMENT_UNKNOWN', 'Payment returned an unknown status');
}

export async function listMyOrders(userId, page = 1, limit = 10) {
  const orders = await orderRepository.listByUser(userId, page, limit);
  const total = await orderRepository.countByUser(userId);
  const totalPages = Math.ceil(total / limit) || 0;

  const serialized = [];
  for (const o of orders) {
    const items = await orderRepository.getOrderItems(o.id);
    serialized.push(orchestrator.serializeOrder(o, items));
  }

  return {
    items: serialized,
    meta: { page, limit, total, totalPages },
  };
}

export default {
  createOrder,
  getOrderDetail,
  cancelOrder,
  confirmPayment,
  listMyOrders,
};
