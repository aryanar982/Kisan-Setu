const Slot = require('../models/Slot');
const Centre = require('../models/Centre');

async function getSlots(centreId, targetDate) {
  const date = targetDate || new Date().toISOString().slice(0, 10);
  let slots = await Slot.find({ centreId, date }).sort({ startTime: 1 });

  // Auto-seed default day slots if none exist yet for this date
  if (slots.length === 0) {
    const centre = await Centre.findById(centreId);
    const capacityPerSlot = centre ? Math.floor(centre.dailyCapacity / 8) : 10;

    const defaultWindows = [
      { startTime: '07:00', endTime: '08:00' },
      { startTime: '08:00', endTime: '09:00' },
      { startTime: '09:00', endTime: '10:00' },
      { startTime: '10:00', endTime: '11:00' },
      { startTime: '11:00', endTime: '12:00' },
      { startTime: '13:00', endTime: '14:00' },
      { startTime: '14:00', endTime: '15:00' },
      { startTime: '15:00', endTime: '16:00' },
    ];

    const docs = defaultWindows.map((w) => ({
      centreId,
      date,
      startTime: w.startTime,
      endTime: w.endTime,
      capacity: capacityPerSlot || 10,
      bookedCount: 0,
      status: 'open',
    }));

    slots = await Slot.insertMany(docs);
  }

  return slots.map((s) => ({
    ...s.toObject(),
    availableCount: Math.max(0, s.capacity - s.bookedCount),
    isFull: s.bookedCount >= s.capacity,
  }));
}

async function createSlot(data) {
  return Slot.create(data);
}

async function updateSlot(slotId, data) {
  return Slot.findByIdAndUpdate(slotId, data, { new: true });
}

module.exports = { getSlots, createSlot, updateSlot };
