const Payment = require('../models/Payment');
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

  payment.status = status;
  if (status === 'completed') {
    payment.disbursedAt = new Date();
  }
  if (details.failureReason) {
    payment.failureReason = details.failureReason;
  }
  await payment.save();

  if (status === 'completed') {
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
