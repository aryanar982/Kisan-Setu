const analyticsService = require('../services/analytics.service');
const { ok } = require('../utils/apiResponse');

async function getOverview(req, res) {
  const data = await analyticsService.getAdminOverview();
  return ok(res, data, 'Analytics data retrieved');
}

module.exports = { getOverview };
