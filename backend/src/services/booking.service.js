const mongoose = require('mongoose');
const Slot = require('../models/Slot');
const Centre = require('../models/Centre');
const Booking = require('../models/Booking');
const Token = require('../models/Token');
const { generateTokenNumber } = require('../utils/queueToken');

/**
 * Creates a booking for a farmer, atomically.
 *
 * This is the reference implementation for architecture doc §8, Approach B:
 * a conditional `findOneAndUpdate` that only succeeds if bookedCount is
 * still below capacity at the moment of the write. Two farmers hitting
 * "book" on the last slot at the same instant CANNOT both succeed — Mongo
 * resolves the race at the document level, no extra locking needed.
 *
 * The whole operation (slot increment + booking doc + token doc) runs
 * inside a transaction so a failure partway through can't leave a
 * dangling incremented slot with no booking behind it.
 *
 * Copy this pattern for any other "claim a limited resource" write in the
 * app — don't reintroduce a plain findById-then-save check-then-write.
 */
async function createBooking({ farmerId, centreId, slotId }) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const slot = await Slot.findOneAndUpdate(
        { _id: slotId, centreId, $expr: { $lt: ['$bookedCount', '$capacity'] } },
        { $inc: { bookedCount: 1 } },
        { new: true, session }
      );

      if (!slot) {
        const err = new Error('This slot is full or no longer available');
        err.status = 409;
        throw err;
      }

      const [booking] = await Booking.create([{ farmerId, centreId, slotId, status: 'booked' }], { session });

      const centre = await Centre.findById(centreId).session(session);
      const centreCode = centre ? centre.name.slice(0, 3).toUpperCase() : 'CTR';
      const tokenNumber = await generateTokenNumber(centreId, centreCode);

      const [token] = await Token.create(
        [{ bookingId: booking._id, centreId, tokenNumber, status: 'issued' }],
        { session }
      );

      result = { booking, token, slot };
    });

    return result;
  } finally {
    session.endSession();
  }
}

async function getFarmerBookings(farmerId) {
  return Booking.find({ farmerId })
    .populate('slotId')
    .populate('centreId', 'name location cropsAccepted')
    .sort({ createdAt: -1 });
}

async function cancelBooking(bookingId, farmerId) {
  const booking = await Booking.findOne({ _id: bookingId, farmerId });
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }
  if (booking.status !== 'booked') {
    const err = new Error(`Cannot cancel a booking that is already ${booking.status}`);
    err.status = 400;
    throw err;
  }

  booking.status = 'cancelled';
  await booking.save();

  // Free up the slot capacity again — this is a plain decrement, not the
  // racy path, since there's no "is there room" condition to protect here.
  await Slot.findByIdAndUpdate(booking.slotId, { $inc: { bookedCount: -1 } });

  return booking;
}

module.exports = { createBooking, getFarmerBookings, cancelBooking };
