const Notification = require('../models/Notification');
const { getIO } = require('../sockets/queue.socket');

async function createNotification({
  recipientId,
  recipientRole = 'Farmer',
  title,
  message,
  type = 'SYSTEM_ALERT',
  channel = 'all',
  metadata = {},
}) {
  const notification = await Notification.create({
    recipientId,
    recipientRole,
    title,
    message,
    type,
    channel,
    metadata,
  });

  // Simulated SMS dispatch log (Phase 9 SMS Gateway adapter)
  if (channel === 'sms' || channel === 'all') {
    console.log(`[SMS-GATEWAY-DISPATCH] Recipient: ${recipientId} | Title: "${title}" | Message: "${message}"`);
  }

  // Real-time Push via Socket.IO
  try {
    const io = getIO();
    io.to(`farmer:${recipientId}:token`).emit('notificationReceived', notification);
  } catch (e) {
    // Socket not ready
  }

  return notification;
}

async function getNotifications(recipientId) {
  return Notification.find({ recipientId }).sort({ createdAt: -1 }).limit(30);
}

async function markAsRead(notificationId) {
  return Notification.findByIdAndUpdate(notificationId, { read: true }, { new: true });
}

async function markAllAsRead(recipientId) {
  return Notification.updateMany({ recipientId, read: false }, { read: true });
}

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
};
