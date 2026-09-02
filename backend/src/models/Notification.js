const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
    recipientModel: { type: String, enum: ['Farmer', 'Admin'], default: 'Farmer' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'SLOT_CONFIRMED',
        'QUEUE_STARTED',
        'QUEUE_DELAYED',
        'TOKEN_NEAR',
        'PROCUREMENT_COMPLETE',
        'PAYMENT_INITIATED',
        'PAYMENT_COMPLETE',
        'SYSTEM_ALERT',
      ],
      default: 'SYSTEM_ALERT',
    },
    channel: {
      type: String,
      enum: ['in_app', 'sms', 'push', 'all'],
      default: 'in_app',
    },
    read: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
