const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

router.get('/', requireAuth, asyncHandler(notificationController.getMyNotifications));
router.patch('/:id/read', requireAuth, asyncHandler(notificationController.markRead));
router.post('/read-all', requireAuth, asyncHandler(notificationController.markAllRead));

module.exports = router;
