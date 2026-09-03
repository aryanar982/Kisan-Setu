const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const { createNotification } = require('./notification.service');

async function getFarmerPayments(farmerId) {
  return Payment.find({ farmerId })
    .populate('procurementId')
    .populate('centreId')
    .sort({ createdAt: -1 });
}

async function updatePaymentStatus(paymentId, status, details = {}) {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    const err = new Error('Payment record not found');
    err.status = 404;
    throw err;
  }

  const allowedTransitions = {
    initiated: ['approved', 'failed'],
    approved: ['completed', 'failed'], // Admin approval directly marks as completed
    processing: ['completed', 'failed'],
    completed: [],
    failed: [],
  };
  if (!Object.prototype.hasOwnProperty.call(allowedTransitions, status)
    || !allowedTransitions[payment.status].includes(status)) {
    const err = new Error(`Invalid payment status transition: ${payment.status} to ${status}`);
    err.status = 400;
    throw err;
  }

  const previousStatus = payment.status;

  payment.status = status;
  if (status === 'completed' || status === 'approved') {
    payment.disbursedAt = new Date();
  }
  if (details.failureReason) {
    payment.failureReason = details.failureReason;
  }
  await payment.save();

  if (details.actorId) {
    await AuditLog.create({
      actorId: details.actorId,
      actorRole: details.actorRole || 'admin',
      action: status === 'approved' ? 'DBT Approved' : `Payment ${status}`,
      targetResource: 'Payment',
      resourceId: payment._id,
      changes: { previousStatus, newStatus: status, amount: payment.amount, reference: payment.transactionId },
    });
  }

  if (status === 'completed' || status === 'approved') {
    await createNotification({
      recipientId: payment.farmerId,
      recipientRole: 'Farmer',
      title: '💰 DBT Payment Credited!',
      message: `₹${payment.amount.toLocaleString('en-IN')} has been credited directly to your bank account (${payment.bankAccountMasked}). UTR: ${payment.transactionId}`,
      type: 'PAYMENT_COMPLETE',
      channel: 'all',
      metadata: { paymentId: payment._id, transactionId: payment.transactionId },
    });
  }

  return payment;
}

async function listAllPayments({ centreId, status }) {
  const query = {};
  if (centreId) query.centreId = centreId;
  if (status) query.status = status;

  return Payment.find(query)
    .populate('farmerId', 'name phone village')
    .populate('centreId', 'name district')
    .sort({ createdAt: -1 });
}

module.exports = {
  getFarmerPayments,
  updatePaymentStatus,
  listAllPayments,
};
