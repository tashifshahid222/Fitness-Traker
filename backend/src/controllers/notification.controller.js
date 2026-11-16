const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const notificationService = require('../services/notification.service');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await notificationService.list(req.user.id, req.query, req.user.notifications);
  const unreadCount = await notificationService.unreadCount(req.user.id);
  return sendSuccess(res, {
    message: 'Notifications retrieved successfully',
    data: items,
    meta: { ...meta, unreadCount },
  });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.user.id, req.params.id);
  return sendSuccess(res, { message: 'Notification marked as read', data: notification });
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user.id);
  return sendSuccess(res, { message: 'All notifications marked as read' });
});

const remove = asyncHandler(async (req, res) => {
  const notification = await notificationService.remove(req.user.id, req.params.id);
  return sendSuccess(res, { message: 'Notification deleted', data: notification });
});

module.exports = { list, markRead, markAllRead, remove };