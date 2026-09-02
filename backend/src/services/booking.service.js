const mongoose = require('mongoose');
const Slot = require('../models/Slot');
const Centre = require('../models/Centre');
const Booking = require('../models/Booking');
const Token = require('../models/Token');
const { generateTokenNumber } = require('../utils/queueToken');
const { getIO } = require('../sockets/queue.socket');
const QRCode = require('qrcode');

async function createBooking({ farmerId, centreId, slotId, cropType, estimatedQuantity }) {
  // Step 1: Atomic slot capacity check-and-increment
  const slot = await Slot.findOneAndUpdate(
    { _id: slotId, centreId, $expr: { $lt: ['$bookedCount', '$capacity'] } },
    { $inc: { bookedCount: 1 } },
    { new: true }
  );

  if (!slot) {
    const err = new Error('This slot is full or no longer available');
    err.status = 409;
    throw err;
  }

  try {
    const centre = await Centre.findById(centreId);
    const centreCode = centre ? centre.name.slice(0, 3).toUpperCase() : 'CTR';
    const tokenNumber = await generateTokenNumber(centreId, centreCode);

    const booking = await Booking.create({
      farmerId,
      centreId,
      slotId,
      cropType: cropType || 'Wheat',
      estimatedQuantity: Number(estimatedQuantity) || 25,
      tokenNumber,
      status: 'booked',
    });

    // Calculate initial queue position and dynamic ETA
    const existingWaiting = await Token.countDocuments({
      centreId,
      status: { $in: ['issued', 'checked_in', 'in_queue'] },
    });
    const queuePosition = existingWaiting + 1;
    const estimatedWaitMinutes = queuePosition * 8; // ~8 mins per farmer

    // Generate QR Code data URL
    const qrPayload = JSON.stringify({
      tokenNumber,
      bookingId: booking._id,
      farmerId,
      centreId,
      slot: `${slot.startTime}-${slot.endTime}`,
    });
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(qrPayload);
    } catch {
      qrDataUrl = `TOKEN:${tokenNumber}`;
    }

    const token = await Token.create({
      bookingId: booking._id,
      centreId,
      farmerId,
      tokenNumber,
      qrData: qrDataUrl,
      status: 'issued',
      queuePosition,
      estimatedWaitMinutes,
    });

    // Emit live real-time update via Socket.io to centre room
    try {
      const io = getIO();
      io.to(`centre:${centreId}:queue`).emit('slotCapacityUpdated', {
        slotId: slot._id,
        bookedCount: slot.bookedCount,
        capacity: slot.capacity,
      });
      io.to(`centre:${centreId}:queue`).emit('newTokenIssued', {
        tokenNumber,
        queuePosition,
      });
    } catch (e) {
      // Socket not yet connected is fine
    }

    return { booking, token, slot };
  } catch (error) {
    // If anything fails after increment, compensate
    await Slot.findByIdAndUpdate(slotId, { $inc: { bookedCount: -1 } });
    throw error;
  }
}

async function getFarmerBookings(farmerId) {
  const bookings = await Booking.find({ farmerId })
    .populate('slotId')
    .populate('centreId')
    .sort({ createdAt: -1 })
    .lean();

  const bookingIds = bookings.map((b) => b._id);
  const tokens = await Token.find({ bookingId: { $in: bookingIds } }).lean();
  const tokenMap = {};
  tokens.forEach((t) => {
    tokenMap[t.bookingId.toString()] = t;
  });

  return bookings.map((b) => ({
    ...b,
    token: tokenMap[b._id.toString()] || null,
  }));
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

  await Slot.findByIdAndUpdate(booking.slotId, { $inc: { bookedCount: -1 } });
  await Token.findOneAndUpdate({ bookingId }, { status: 'no_show' });

  return booking;
}

module.exports = { createBooking, getFarmerBookings, cancelBooking };
