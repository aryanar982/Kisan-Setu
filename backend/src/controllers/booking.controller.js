const bookingService = require('../services/booking.service');
const { ok } = require('../utils/apiResponse');

async function create(req, res) {
  const { centreId, slotId } = req.body;
  const result = await bookingService.createBooking({
    farmerId: req.user.id,
    centreId,
    slotId,
  });
  return ok(res, result, 'Slot booked — your token has been issued', 201);
}

async function mine(req, res) {
  const bookings = await bookingService.getFarmerBookings(req.user.id);
  return ok(res, bookings);
}

async function cancel(req, res) {
  const booking = await bookingService.cancelBooking(req.params.id, req.user.id);
  return ok(res, booking, 'Booking cancelled');
}

module.exports = { create, mine, cancel };
