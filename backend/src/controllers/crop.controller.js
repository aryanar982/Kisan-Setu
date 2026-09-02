const cropService = require('../services/crop.service');
const { ok } = require('../utils/apiResponse');

async function createCrop(req, res) {
  const crop = await cropService.registerCrop(req.user.id, req.body);
  return ok(res, crop, 'Crop registered successfully', 201);
}

async function getMyCrops(req, res) {
  const crops = await cropService.getFarmerCrops(req.user.id);
  return ok(res, crops, 'Crops retrieved');
}

async function getMspRates(req, res) {
  const rates = await cropService.getMspRates();
  return ok(res, rates, 'MSP rates retrieved');
}

module.exports = { createCrop, getMyCrops, getMspRates };
