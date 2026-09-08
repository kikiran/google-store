import { randomBytes, randomInt } from 'node:crypto';
import { ApiError, logger } from '@nova/shared';
import shippingRepository from '../repositories/shipping.repository.js';

function toShipmentResponse(row, events = null) {
  if (!row) return null;
  let address = row.address;
  if (typeof address === 'string') {
    try {
      address = JSON.parse(address);
    } catch {
      address = null;
    }
  }
  return {
    id: row.id,
    shipmentNumber: row.shipment_number,
    orderId: row.order_id,
    carrier: row.carrier,
    trackingNumber: row.tracking_number,
    methodCode: row.method_code,
    recipientName: row.recipient_name,
    recipientPhone: row.recipient_phone,
    address,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    events: events || undefined,
  };
}

function randomTrackingNumber() {
  let digits = '';
  for (let i = 0; i < 10; i += 1) digits += randomInt(0, 10).toString();
  return `NVL${digits}`;
}

export async function listMethods() {
  const rows = await shippingRepository.listActiveMethods();
  return rows.map((m) => ({
    id: m.id,
    code: m.code,
    name: m.name,
    description: m.description,
    fee: Number(m.fee),
    estimatedDaysMin: m.estimated_days_min,
    estimatedDaysMax: m.estimated_days_max,
  }));
}

export async function createShipment({ orderId, methodCode, recipientName, recipientPhone, address }) {
  // Idempotent — return existing shipment if already created
  const existing = await shippingRepository.findByOrderId(orderId);
  if (existing) {
    const events = await shippingRepository.getShipmentEvents(existing.id);
    return { shipment: toShipmentResponse(existing, events), created: false };
  }

  const shipmentNumber = `SHIP-NV-${randomBytes(5).toString('hex').toUpperCase()}`;
  const trackingNumber = randomTrackingNumber();
  const id = await shippingRepository.createShipment({
    shipmentNumber,
    orderId,
    trackingNumber,
    methodCode,
    recipientName,
    recipientPhone,
    address,
  });
  await shippingRepository.insertShipmentEvent(id, 'PENDING', null, 'Shipment created');

  const row = await shippingRepository.findById(id);
  const events = await shippingRepository.getShipmentEvents(id);
  return { shipment: toShipmentResponse(row, events), created: true };
}

export async function getShipmentByOrderId(orderId) {
  const row = await shippingRepository.findByOrderId(orderId);
  if (!row) return null;
  const events = await shippingRepository.getShipmentEvents(row.id);
  return toShipmentResponse(row, events);
}

export async function getShipmentByTrackingNumber(trackingNumber) {
  const row = await shippingRepository.findByTrackingNumber(trackingNumber);
  if (!row) throw ApiError.notFound('SHIPMENT_NOT_FOUND', 'Shipment not found');
  const events = await shippingRepository.getShipmentEvents(row.id);
  return toShipmentResponse(row, events);
}

export async function addShipmentEvent(id, { status, location, note }) {
  const row = await shippingRepository.findById(id);
  if (!row) throw ApiError.notFound('SHIPMENT_NOT_FOUND', 'Shipment not found');

  await shippingRepository.insertShipmentEvent(id, status, location, note);

  // If delivered, update shipment status
  if (status === 'DELIVERED') {
    await shippingRepository.updateShipmentStatus(id, 'DELIVERED');
  }

  const updated = await shippingRepository.findById(id);
  const events = await shippingRepository.getShipmentEvents(id);
  return toShipmentResponse(updated, events);
}

export default { listMethods, createShipment, getShipmentByOrderId, getShipmentByTrackingNumber, addShipmentEvent };
