const slotService = require('../services/slot.service');
const { ok } = require('../utils/apiResponse');

async function getSlots(req, res) {
  const { centreId } = req.params;
  const { date } = req.query;
  const slots = await slotService.getSlots(centreId, date);
  return ok(res, slots, 'Slots retrieved');
}

async function createSlot(req, res) {
  const slot = await slotService.createSlot(req.body);
  return ok(res, slot, 'Slot created', 201);
}

async function updateSlot(req, res) {
  const slot = await slotService.updateSlot(req.params.id, req.body);
  return ok(res, slot, 'Slot updated');
}

module.exports = { getSlots, createSlot, updateSlot };
