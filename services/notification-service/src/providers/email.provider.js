import { config, logger } from '@nova/shared';

/**
 * Email provider abstraction. `send` accepts a message payload and returns
 * `{ status, externalRef }`. The dev provider logs the message instead of
 * delivering it; a real provider (SMTP/SendGrid/etc.) would implement the
 * exact same interface.
 */
function logProvider({ toEmail, fromEmail, subject, htmlBody }) {
  logger.info({ toEmail, fromEmail, subject, htmlBody }, 'email [log-provider] simulated send');
  const externalRef = `log-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
  return { status: 'SENT', externalRef };
}

const PROVIDERS = {
  log: logProvider,
};

export function send(payload) {
  const name = config.env('EMAIL_PROVIDER', 'log');
  const provider = PROVIDERS[name] || logProvider;
  return provider(payload);
}

export default { send };