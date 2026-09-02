const Crop = require('../models/Crop');

const MSP_TABLE = {
  Wheat: 2425,
  Paddy: 2300,
  Mustard: 5650,
  Cotton: 7121,
  Bajra: 2625,
  Barley: 1850,
  Gram: 5440,
};

async function registerCrop(farmerId, { cropType, variety, estimatedQuantity, harvestSeason, landAreaAcres }) {
  const mspPerQuintal = MSP_TABLE[cropType] || 2400;
  return Crop.create({
    farmerId,
    cropType,
    variety: variety || 'Standard High-Yield',
    estimatedQuantity: Number(estimatedQuantity),
    harvestSeason: harvestSeason || 'Rabi 2026',
    mspPerQuintal,
    landAreaAcres: Number(landAreaAcres) || 2.5,
  });
}

async function getFarmerCrops(farmerId) {
  return Crop.find({ farmerId }).sort({ createdAt: -1 });
}

async function getMspRates() {
  return MSP_TABLE;
}

module.exports = { registerCrop, getFarmerCrops, getMspRates };
