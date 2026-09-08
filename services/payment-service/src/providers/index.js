import { config } from '@nova/shared';
import mockProvider from './mock.provider.js';

/**
 * Provider abstraction layer.
 *
 * Each provider implements the interface:
 *   - charge(payment) -> Promise<{ status, providerReference, metadata, errorReason }>
 *   - refund(payment) -> Promise<{ status }>
 *
 * To add a real provider (e.g. Razorpay / Stripe):
 *   1. Create `src/providers/razorpay.provider.js` exporting { name, charge, refund }.
 *   2. Register it in the PROVIDERS map below keyed by its name.
 * Then select it via env, e.g.:
 *     PAYMENT_PROVIDER=razorpay
 * and the service will use it automatically (see getProvider).
 */

const PROVIDERS = {
  mock: mockProvider,
};

export function getProvider(name) {
  return PROVIDERS[name] || mockProvider;
}

// Resolve provider from env (DB default is 'mock'); PAYMENT_PROVIDER overrides.
export function defaultProviderName() {
  return config.env('PAYMENT_PROVIDER', 'mock');
}

export default { getProvider, defaultProviderName };
