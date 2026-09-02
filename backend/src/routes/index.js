const express = require('express');
const authRoutes = require('./auth.routes');
const cropRoutes = require('./crop.routes');
const centreRoutes = require('./centre.routes');
const slotRoutes = require('./slot.routes');
const bookingRoutes = require('./booking.routes');
const queueRoutes = require('./queue.routes');
const procurementRoutes = require('./procurement.routes');
const paymentRoutes = require('./payment.routes');
const notificationRoutes = require('./notification.routes');
const analyticsRoutes = require('./analytics.routes');
const aiRoutes = require('./ai.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/crops', cropRoutes);
router.use('/centres', centreRoutes);
router.use('/slots', slotRoutes);
router.use('/bookings', bookingRoutes);
router.use('/queue', queueRoutes);
router.use('/procurement', procurementRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/ai', aiRoutes);

module.exports = router;
