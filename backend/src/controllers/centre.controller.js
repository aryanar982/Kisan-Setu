const centreService = require('../services/centre.service');
const { ok } = require('../utils/apiResponse');

async function listCentres(req, res) {
  const { district, crop, userLat, userLng } = req.query;
  const centres = await centreService.listCentres({ district, crop, userLat, userLng });
  return ok(res, centres, 'Centres retrieved');
}

async function getCentre(req, res) {
  const { date } = req.query;
  const centre = await centreService.getCentreById(req.params.id, date);
  return ok(res, centre, 'Centre details retrieved');
}

async function createCentre(req, res) {
  const centre = await centreService.createCentre(req.body);
  return ok(res, centre, 'Centre created', 201);
}

async function updateCentre(req, res) {
  const updated = await centreService.updateCentre(req.params.id, req.body);
  return ok(res, updated, 'Centre updated');
}

module.exports = {
  listCentres,
  getCentre,
  createCentre,
  updateCentre,
};
