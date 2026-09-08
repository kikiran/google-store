import { ApiError, config, logger } from '@nova/shared';
import notificationRepository from '../repositories/notification.repository.js';
import templateService from './template.service.js';
import emailProvider from '../providers/email.provider.js';

const fromEmail = () => config.env('EMAIL_FROM', 'no-reply@nova.dev');

function serializeNotification(n) {
  return {
    id: String(n.id),
    userId: n.user_id ? String(n.user_id) : null,
    email: n.email,
    channel: n.channel,
    type: n.type,
    subject: n.subject,
    body: n.body,
    externalRef: n.external_ref,
    read: Boolean(n.read_at),
    createdAt: n.created_at,
  };
}

export async function sendNotification(body) {
  const { type, email, userId, ...payload } = body;

  const template = await templateService.getTemplate(type);
  if (!template) throw ApiError.notFound('TEMPLATE_NOT_FOUND', `No template found for notification type "${type}"`);

  const { subject, body: renderedBody } = templateService.render(template, payload);
  const from = fromEmail();

  const providerResult = await emailProvider.send({
    toEmail: email,
    fromEmail: from,
    subject,
    htmlBody: renderedBody,
  });

  await notificationRepository.insertNotification({
    userId,
    email,
    channel: 'email',
    type,
    subject,
    body: renderedBody,
    payload: body,
    externalRef: providerResult.externalRef,
  });

  await notificationRepository.insertEmailLog({
    toEmail: email,
    fromEmail: from,
    subject,
    htmlBody: renderedBody,
    provider: config.env('EMAIL_PROVIDER', 'log'),
    status: providerResult.status,
  });

  logger.info({ type, toEmail: email, externalRef: providerResult.externalRef }, 'notification queued');
  return { queued: true, externalRef: providerResult.externalRef };
}

export async function listForUser(userId, email) {
  const rows = await notificationRepository.listForUser({ userId, email });
  return rows.map(serializeNotification);
}

export async function markRead(userId, email, id) {
  const existing = await notificationRepository.findById(id);
  if (!existing) throw ApiError.notFound('NOTIFICATION_NOT_FOUND', 'Notification not found');
  const owns =
    (existing.user_id && String(existing.user_id) === String(userId)) ||
    (existing.email && String(existing.email).toLowerCase() === String(email || '').toLowerCase());
  if (!owns) throw ApiError.forbidden('FORBIDDEN', 'You can only mark your own notifications as read');
  await notificationRepository.markRead(id);
  return { id: String(id), read: true };
}

export async function adminListLogs({ page, limit }) {
  const [rows, total] = await Promise.all([
    notificationRepository.adminFindPageable(page, limit),
    notificationRepository.adminCount(),
  ]);
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    logs: rows.map((l) => ({
      id: String(l.id),
      toEmail: l.to_email,
      fromEmail: l.from_email,
      subject: l.subject,
      provider: l.provider,
      status: l.status,
      error: l.error,
      createdAt: l.created_at,
    })),
    meta: { page, limit, total, totalPages },
  };
}

export default { sendNotification, listForUser, markRead, adminListLogs };