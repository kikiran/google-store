import { randomBytes } from 'node:crypto';
import { config } from '@nova/shared';

/**
 * Mock payment provider — simulates an external PSP (Razorpay/Stripe).
 * Implements the { charge, refund } contract expected by the provider
 * abstraction layer. A future real provider would implement the same shape.
 */
export const name = 'mock';

export async function charge(payment) {
  const { method, card, upi } = payment;

  // Env switch for forced failure (testing/provisioning)
  if (config.env('MOCK_PAYMENT_PROVIDER') === 'fail') {
    return { status: 'FAILED', providerReference: null, metadata: {}, errorReason: 'PROVIDER_DOWN' };
  }

  if (method === 'card' && card?.number) {
    const last4 = card.number.slice(-4);
    if (card.number.endsWith('0000')) {
      return { status: 'FAILED', providerReference: null, metadata: { last4 }, errorReason: 'CARD_DECLINED' };
    }
    if (card.number.endsWith('1111')) {
      return { status: 'FAILED', providerReference: null, metadata: { last4 }, errorReason: 'INSUFFICIENT_FUNDS' };
    }
    return { status: 'CONFIRMED', providerReference: `mockref_${randomBytes(8).toString('hex')}`, metadata: { last4 }, errorReason: null };
  }

  if (method === 'upi') {
    const vpa = upi?.vpa || '';
    if (vpa.includes('fail')) {
      return { status: 'FAILED', providerReference: null, metadata: { vpa }, errorReason: 'UPI_REJECTED' };
    }
    return { status: 'CONFIRMED', providerReference: `mockref_${randomBytes(8).toString('hex')}`, metadata: { vpa }, errorReason: null };
  }

  // wallet, netbanking, mock -> always success
  return { status: 'CONFIRMED', providerReference: `mockref_${randomBytes(8).toString('hex')}`, metadata: { method }, errorReason: null };
}

export async function refund() {
  // Mock always completes refunds immediately
  return { status: 'COMPLETED', providerReference: `mockrefund_${randomBytes(8).toString('hex')}` };
}

export default { name, charge, refund };
