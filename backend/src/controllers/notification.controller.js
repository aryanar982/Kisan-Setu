const notificationService = require('../services/notification.service');
const { ok } = require('../utils/apiResponse');

async function getMyNotifications(req, res) {
  const list = await notificationService.getNotifications(req.user.id);
  return ok(res, list, 'Notifications retrieved');
}

async function markRead(req, res) {
  const item = await notificationService.markAsRead(req.params.id);
  return ok(res, item, 'Marked as read');
}

async function markAllRead(req, res) {
  await notificationService.markAllAsRead(req.user.id);
  return ok(res, null, 'All marked as read');
}

module.exports = {
  getMyNotifications,
  markRead,
  markAllRead,
};
