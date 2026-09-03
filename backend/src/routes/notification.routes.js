const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

router.get('/', requireAuth, rbac(['farmer', 'admin', 'state_admin', 'district_admin', 'centre_staff']), asyncHandler(notificationController.getMyNotifications));
router.patch('/:id/read', requireAuth, rbac(['farmer', 'admin', 'state_admin', 'district_admin', 'centre_staff']), asyncHandler(notificationController.markRead));
router.post('/read-all', requireAuth, rbac(['farmer', 'admin', 'state_admin', 'district_admin', 'centre_staff']), asyncHandler(notificationController.markAllRead));

module.exports = router;
