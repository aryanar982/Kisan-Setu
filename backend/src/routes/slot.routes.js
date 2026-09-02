const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const slotController = require('../controllers/slot.controller');

const router = express.Router();

router.get('/centre/:centreId', asyncHandler(slotController.getSlots));
router.post('/', requireAuth, rbac(['admin', 'centre_staff', 'district_admin']), asyncHandler(slotController.createSlot));
router.put('/:id', requireAuth, rbac(['admin', 'centre_staff', 'district_admin']), asyncHandler(slotController.updateSlot));

module.exports = router;
