import { randomBytes } from 'node:crypto';
import { ApiError } from '@nova/shared';
import { db } from '@nova/shared';
import paymentRepository from '../repositories/payment.repository.js';
import { getProvider, defaultProviderName } from '../providers/index.js';
import { pool } from '../db.js';

function parseMetadata(row) {
  if (!row) return null;
  const copy = { ...row };
  if (typeof copy.metadata === 'string') {
    try {
      copy.metadata = JSON.parse(copy.metadata);
    } catch {
      copy.metadata = null;
    }
  }
  return copy;
}

/**
 * Merge error reason from metadata for frontend/order-service consumption.
 */
function toPaymentResponse(row) {
  if (!row) return null;
  const parsed = parseMetadata(row);
  let errorReason = null;
  if (parsed.status === 'FAILED' && parsed.metadata?.errorReason) {
    errorReason = parsed.metadata.errorReason;
  }
  const { id, ...rest } = parsed;
  void id;
  return {
    paymentId: rest.payment_id,
    orderId: rest.order_id,
    amount: Number(rest.amount),
    status: rest.status,
    method: rest.method,
    providerReference: rest.provider_reference,
    errorReason,
    metadata: rest.metadata,
    createdAt: rest.created_at,
  };
}

export async function chargePayment({ orderId, amount, currency = 'INR', method = 'mock', card, upi, userId, email }) {
  const providerName = defaultProviderName();
  const provider = getProvider(providerName);
  const paymentId = `pay_${randomBytes(12).toString('hex')}`;

  // Create PENDING payment row, then run the async provider charge.
  const rowId = await paymentRepository.createPayment({
    paymentId,
    orderId,
    userId,
    amount,
    currency,
    method,
    provider: providerName,
  });

  let result;
  try {
    result = await provider.charge({ orderId, amount, currency, method, card, upi, userId, email, paymentId });
  } catch (err) {
    // Provider threw unexpectedly -> mark failed
    result = { status: 'FAILED', providerReference: null, metadata: {}, errorReason: 'PROVIDER_ERROR' };
  }

  const metadata = { ...(result.metadata || {}), ...(result.errorReason ? { errorReason: result.errorReason } : {}) };
  await paymentRepository.updatePaymentStatus(rowId, result.status, result.providerReference, metadata);

  const row = await paymentRepository.findByPaymentId(paymentId);
  return toPaymentResponse(row);
}

export async function refundPayment({ orderId, reason = '' }) {
  const payment = await paymentRepository.findConfirmedByOrderId(orderId);
  if (!payment) {
    throw ApiError.notFound('PAYMENT_NOT_FOUND', 'No confirmed payment found for this order');
  }

  const provider = getProvider(payment.provider || 'mock');
  const refundId = `ref_${randomBytes(12).toString('hex')}`;
  const amount = Number(payment.amount);

  // Create refund row and complete it via provider
  const refundRowId = await db.transaction(pool, async (conn) => {
    const [result] = await conn.execute(
      `INSERT INTO refunds (refund_id, payment_id, amount, reason, status) VALUES (?, ?, ?, ?, 'PENDING')`,
      [refundId, payment.id, amount, reason || null]
    );
    return result.insertId;
  });

  let refundResult;
  try {
    refundResult = await provider.refund({ orderId, amount, paymentId: payment.payment_id, reason });
  } catch {
    refundResult = { status: 'FAILED' };
  }

  await pool.execute(`UPDATE refunds SET status = ?, updated_at = NOW() WHERE id = ?`, [refundResult.status, refundRowId]);

  if (refundResult.status === 'COMPLETED') {
    await paymentRepository.updatePaymentRefunded(payment.id);
  }

  const refund = {
    refundId,
    orderId,
    amount,
    reason: reason || null,
    status: refundResult.status,
  };
  return refund;
}

export async function getPaymentByOrderId(orderId) {
  const row = await paymentRepository.findByOrderId(orderId);
  return toPaymentResponse(row);
}

export default { chargePayment, refundPayment, getPaymentByOrderId };
