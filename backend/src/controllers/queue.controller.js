const queueService = require('../services/queue.service');
const { ok } = require('../utils/apiResponse');

async function getCentreQueue(req, res) {
  const { centreId } = req.params;
  const queue = await queueService.getCentreQueue(centreId);
  return ok(res, queue, 'Queue retrieved');
}

async function verifyToken(req, res) {
  const { tokenNumber } = req.body;
  const centreId = req.user && req.user.centreId ? req.user.centreId : req.body.centreId;
  const token = await queueService.verifyToken(tokenNumber, centreId);
  return ok(res, token, 'Token verified');
}

async function callNext(req, res) {
  const centreId = req.params.centreId || (req.user && req.user.centreId);
  const result = await queueService.callNextToken(centreId);
  return ok(res, result, 'Next token called');
}

async function updateStatus(req, res) {
  const { tokenId } = req.params;
  const { status, remarks } = req.body;
  const updated = await queueService.updateTokenStatus(tokenId, status, remarks);
  return ok(res, updated, 'Token status updated');
}

module.exports = {
  getCentreQueue,
  verifyToken,
  callNext,
  updateStatus,
};
