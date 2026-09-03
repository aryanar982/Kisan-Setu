const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const bookingController = require('../controllers/booking.controller');

const router = express.Router();

const createBookingSchema = z.object({
  centreId: z.string().min(1),
  slotId: z.string().min(1),
  cropType: z.string().min(1).optional(),
  estimatedQuantity: z.coerce.number().positive().optional(),
});

// Farmers can create/view/cancel their own bookings
router.post('/', requireAuth, rbac(['farmer']), validate(createBookingSchema), asyncHandler(bookingController.create));
router.get('/me', requireAuth, rbac(['farmer']), asyncHandler(bookingController.mine));
router.patch('/:id/cancel', requireAuth, rbac(['farmer']), asyncHandler(bookingController.cancel));

module.exports = router;
