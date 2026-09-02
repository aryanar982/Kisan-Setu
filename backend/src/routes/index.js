const express = require('express');
const authRoutes = require('./auth.routes');
const bookingRoutes = require('./booking.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/bookings', bookingRoutes);

// Add the rest of the resources here as they're built, following the same
// pattern as auth/booking — see architecture doc §6 for the full list:
// /centres  /slots  /queue  /procurement  /payments  /admin

module.exports = router;
