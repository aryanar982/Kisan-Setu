const express = require('express');
const { z } = require('zod');
const auth = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const bookingController = require('../controllers/booking.controller');

const router = express.Router();

const createBookingSchema = z.object({
  centreId: z.string().min(1),
  slotId: z.string().min(1),
});

// Only farmers can create/view/cancel their own bookings.
router.post('/', auth, rbac(['farmer']), validate(createBookingSchema), asyncHandler(bookingController.create));
router.get('/me', auth, rbac(['farmer']), asyncHandler(bookingController.mine));
router.patch('/:id/cancel', auth, rbac(['farmer']), asyncHandler(bookingController.cancel));

module.exports = router;
