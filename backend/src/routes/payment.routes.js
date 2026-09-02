const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const paymentController = require('../controllers/payment.controller');

const router = express.Router();

router.get('/my', requireAuth, asyncHandler(paymentController.getMyPayments));
router.get('/', requireAuth, rbac(['admin', 'state_admin', 'district_admin', 'centre_staff']), asyncHandler(paymentController.listAllPayments));
router.patch('/:id/status', requireAuth, rbac(['admin', 'state_admin', 'district_admin', 'centre_staff']), asyncHandler(paymentController.updateStatus));

module.exports = router;
