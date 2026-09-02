const paymentService = require('../services/payment.service');
const { ok } = require('../utils/apiResponse');

async function getMyPayments(req, res) {
  const payments = await paymentService.getFarmerPayments(req.user.id);
  return ok(res, payments, 'Farmer payments retrieved');
}

async function updateStatus(req, res) {
  const { status, failureReason } = req.body;
  const payment = await paymentService.updatePaymentStatus(req.params.id, status, { failureReason });
  return ok(res, payment, 'Payment status updated');
}

async function listAllPayments(req, res) {
  const { centreId, status } = req.query;
  const payments = await paymentService.listAllPayments({ centreId, status });
  return ok(res, payments, 'All payments retrieved');
}

module.exports = {
  getMyPayments,
  updateStatus,
  listAllPayments,
};
