import { asyncHandler, success } from '@nova/shared';
import notificationService from '../services/notification.service.js';

export const listEmailLogs = asyncHandler(async (req, res) => {
  const { logs, meta } = await notificationService.adminListLogs(req.query);
  success(res, { logs }, 'Notification logs', meta);
});

export default { listEmailLogs };