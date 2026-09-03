const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const queueController = require('../controllers/queue.controller');

const router = express.Router();

router.get('/centre/:centreId', requireAuth, rbac(['farmer', 'admin', 'state_admin', 'district_admin', 'centre_staff']), asyncHandler(queueController.getCentreQueue));
router.post('/verify', requireAuth, rbac(['admin', 'centre_staff', 'district_admin']), asyncHandler(queueController.verifyToken));
router.post('/call-next/:centreId', requireAuth, rbac(['admin', 'centre_staff', 'district_admin']), asyncHandler(queueController.callNext));
router.patch('/:tokenId/status', requireAuth, rbac(['admin', 'centre_staff', 'district_admin']), asyncHandler(queueController.updateStatus));

module.exports = router;
