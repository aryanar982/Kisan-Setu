const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const analyticsController = require('../controllers/analytics.controller');

const router = express.Router();

router.get(
  '/dashboard',
  requireAuth,
  rbac(['admin', 'state_admin', 'district_admin', 'centre_staff']),
  asyncHandler(analyticsController.getOverview)
);

module.exports = router;
