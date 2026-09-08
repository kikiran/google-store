import { asyncHandler, created, success } from '@nova/shared';
import notificationService from '../services/notification.service.js';

export const send = asyncHandler(async (req, res) => {
  const result = await notificationService.sendNotification(req.body);
  created(res, result, 'Notification queued');
});

export const list = asyncHandler(async (req, res) => {
  const notifications = await notificationService.listForUser(req.user.id, req.user.email);
  success(res, { notifications }, 'Notifications');
});

export const markRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markRead(req.user.id, req.user.email, Number(req.params.id));
  success(res, result, 'Notification marked as read');
});

export default { send, list, markRead };