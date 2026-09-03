const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const aiController = require('../controllers/ai.controller');

const router = express.Router();

router.post('/voice-intent', requireAuth, rbac(['farmer', 'admin', 'state_admin', 'district_admin', 'centre_staff']), asyncHandler(aiController.processVoice));
router.get('/recommendations', requireAuth, rbac(['farmer', 'admin', 'state_admin', 'district_admin', 'centre_staff']), asyncHandler(aiController.getRecommendations));

module.exports = router;
