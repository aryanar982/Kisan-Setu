const aiService = require('../services/ai.service');
const { ok } = require('../utils/apiResponse');

async function processVoice(req, res) {
  const { speechText, language } = req.body;
  const result = aiService.parseVoiceIntent({ speechText, language });
  return ok(res, result, 'Voice intent processed');
}

async function getRecommendations(req, res) {
  const { userLat, userLng } = req.query;
  const recommendations = await aiService.getCrowdRecommendations({ userLat, userLng });
  return ok(res, recommendations, 'AI recommendations generated');
}

module.exports = {
  processVoice,
  getRecommendations,
};
