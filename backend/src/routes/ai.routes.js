const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const aiController = require('../controllers/ai.controller');

const router = express.Router();

router.post('/voice-intent', asyncHandler(aiController.processVoice));
router.get('/recommendations', asyncHandler(aiController.getRecommendations));

module.exports = router;
