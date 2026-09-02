const Centre = require('../models/Centre');
const Slot = require('../models/Slot');
const Token = require('../models/Token');

// Haversine formula to compute distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

async function listCentres({ district, crop, userLat, userLng }) {
  const query = { activeStatus: true };
  if (district) query.district = new RegExp(district, 'i');
  if (crop) query.cropsAccepted = crop;

  const centres = await Centre.find(query).lean();

  const enriched = centres.map((centre) => {
    let distanceKm = null;
    if (userLat && userLng && centre.location && centre.location.lat && centre.location.lng) {
      distanceKm = calculateDistance(Number(userLat), Number(userLng), centre.location.lat, centre.location.lng);
    }

    // Dynamic crowd congestion tag: Low (< 10), Moderate (10 - 25), Busy (> 25)
    let crowdStatus = 'Low';
    if (centre.currentQueueCount > 25) crowdStatus = 'High';
    else if (centre.currentQueueCount >= 10) crowdStatus = 'Moderate';

    return {
      ...centre,
      distanceKm,
      crowdStatus,
    };
  });

  if (userLat && userLng) {
    enriched.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
  }

  return enriched;
}

async function getCentreById(centreId, targetDate) {
  const centre = await Centre.findById(centreId).lean();
  if (!centre) {
    const err = new Error('Centre not found');
    err.status = 404;
    throw err;
  }

  const date = targetDate || new Date().toISOString().slice(0, 10);
  const slots = await Slot.find({ centreId, date }).sort({ startTime: 1 });

  // Current active tokens count
  const activeQueueCount = await Token.countDocuments({
    centreId,
    status: { $in: ['in_queue', 'being_served'] },
  });

  return {
    ...centre,
    slots,
    activeQueueCount,
  };
}

async function createCentre(data) {
  return Centre.create(data);
}

async function updateCentre(centreId, data) {
  return Centre.findByIdAndUpdate(centreId, data, { new: true });
}

module.exports = {
  listCentres,
  getCentreById,
  createCentre,
  updateCentre,
  calculateDistance,
};
