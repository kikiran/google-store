import { logger } from '@nova/shared';
import { NOTIFICATION_SERVICE_URL } from '../config.js';

function serviceToken() {
  return process.env.SERVICE_TOKEN || 'nova-internal';
}

/**
 * Fire-and-forget notification dispatch. Failures are logged, never thrown,
 * so notification delivery does not break the order flow.
 */
export async function sendNotification(type, payload) {
  try {
    const res = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-service-token': serviceToken() },
      body: JSON.stringify({ type, ...payload }),
    });
    if (!res.ok) logger.warn({ status: res.status, type }, 'notification send failed');
  } catch (err) {
    logger.warn({ err: err.message, type }, 'notification service unreachable');
  }
}

export default { sendNotification };
