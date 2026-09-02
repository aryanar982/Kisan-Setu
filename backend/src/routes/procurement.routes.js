const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const procurementController = require('../controllers/procurement.controller');

const router = express.Router();

router.post(
  '/',
  requireAuth,
  rbac(['admin', 'centre_staff', 'district_admin']),
  asyncHandler(procurementController.recordProcurement)
);

router.get('/booking/:bookingId', requireAuth, asyncHandler(procurementController.getByBooking));
router.get('/', requireAuth, asyncHandler(procurementController.listProcurements));

module.exports = router;
