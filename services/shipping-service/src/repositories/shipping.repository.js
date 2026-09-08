import pool from '../db.js';

export async function listActiveMethods() {
  const [rows] = await pool.execute(
    `SELECT id, code, name, description, fee, estimated_days_min, estimated_days_max, sort_order
     FROM delivery_methods WHERE is_active = 1 ORDER BY sort_order ASC`
  );
  return rows;
}

export async function findByOrderId(orderId) {
  const [rows] = await pool.execute(
    `SELECT id, shipment_number, order_id, carrier, tracking_number, method_code,
            recipient_name, recipient_phone, address, status, created_at, updated_at
     FROM shipments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1`,
    [orderId]
  );
  return rows[0] || null;
}

export async function findByTrackingNumber(trackingNumber) {
  const [rows] = await pool.execute(
    `SELECT id, shipment_number, order_id, carrier, tracking_number, method_code,
            recipient_name, recipient_phone, address, status, created_at, updated_at
     FROM shipments WHERE tracking_number = ? LIMIT 1`,
    [trackingNumber]
  );
  return rows[0] || null;
}

export async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT id, shipment_number, order_id, carrier, tracking_number, method_code,
            recipient_name, recipient_phone, address, status, created_at, updated_at
     FROM shipments WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function createShipment({ shipmentNumber, orderId, trackingNumber, methodCode, recipientName, recipientPhone, address }) {
  const [result] = await pool.execute(
    `INSERT INTO shipments (shipment_number, order_id, carrier, tracking_number, method_code,
            recipient_name, recipient_phone, address, status)
     VALUES (?, ?, 'Nova Logistics', ?, ?, ?, ?, ?, 'PENDING')`,
    [shipmentNumber, orderId, trackingNumber, methodCode, recipientName, recipientPhone, JSON.stringify(address)]
  );
  return result.insertId;
}

export async function insertShipmentEvent(shipmentId, status, location, note) {
  const [result] = await pool.execute(
    `INSERT INTO shipment_events (shipment_id, status, location, note) VALUES (?, ?, ?, ?)`,
    [shipmentId, status, location || null, note || null]
  );
  return result.insertId;
}

export async function getShipmentEvents(shipmentId) {
  const [rows] = await pool.execute(
    `SELECT id, status, location, note, created_at FROM shipment_events
     WHERE shipment_id = ? ORDER BY created_at ASC`,
    [shipmentId]
  );
  return rows;
}

export async function updateShipmentStatus(id, status) {
  await pool.execute(`UPDATE shipments SET status = ?, updated_at = NOW() WHERE id = ?`, [status, id]);
}

export default {
  listActiveMethods,
  findByOrderId,
  findByTrackingNumber,
  findById,
  createShipment,
  insertShipmentEvent,
  getShipmentEvents,
  updateShipmentStatus,
};
