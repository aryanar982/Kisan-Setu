const procurementService = require('../services/procurement.service');
const { ok } = require('../utils/apiResponse');

async function recordProcurement(req, res) {
  const officerId = req.user.id;
  const result = await procurementService.recordProcurement({
    ...req.body,
    officerId,
  });
  return ok(res, result, 'Procurement entry recorded and payment initiated', 201);
}

async function getByBooking(req, res) {
  const result = await procurementService.getProcurementByBooking(req.params.bookingId);
  return ok(res, result, 'Procurement record retrieved');
}

async function listProcurements(req, res) {
  const { centreId, farmerId } = req.query;
  const result = await procurementService.listProcurements({ centreId, farmerId });
  return ok(res, result, 'Procurement records retrieved');
}

module.exports = {
  recordProcurement,
  getByBooking,
  listProcurements,
};
