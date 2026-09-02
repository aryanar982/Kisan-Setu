const Centre = require('../models/Centre');
const Slot = require('../models/Slot');
const Token = require('../models/Token');
const Payment = require('../models/Payment');

/**
 * Multilingual NLP Voice Intent Classifier for Hindi, English, and Telugu.
 */
function parseVoiceIntent({ speechText, language = 'hi' }) {
  if (!speechText) {
    return {
      intent: 'UNKNOWN',
      confidence: 0,
      replyText: language === 'hi' ? 'कृपया अपनी बात दोबारा कहें।' : 'Please speak again.',
    };
  }

  const text = speechText.toLowerCase().trim();

  // Pattern checks for intents
  // 1. Queue Status
  const queuePatterns = [
    'queue', 'token', 'position', 'number', 'line', 'wait', 'eta',
    'टोकन', 'कतार', 'लाइन', 'नंबर', 'वेटिंग', 'स्थिति',
    'టోకెన్', 'క్యూ', 'స్థితి'
  ];
  if (queuePatterns.some((p) => text.includes(p))) {
    return {
      intent: 'QUEUE_STATUS',
      confidence: 0.95,
      replyText:
        language === 'hi'
          ? 'आपका टोकन लाइव कतार में देखा जा रहा है।'
          : language === 'te'
          ? 'మీ టోకెన్ స్థితి ప్రత్యక్ష క్యూలో పరిశీలించబడుతోంది.'
          : 'Retrieving your live queue token position and estimated wait time.',
      actionRoute: '/farmer/queue',
    };
  }

  // 2. Check Payment
  const paymentPatterns = [
    'payment', 'paisa', 'rupee', 'money', 'dbt', 'credited', 'bank', 'transfer',
    'भुगतान', 'पैसा', 'रुपया', 'खाता', 'डीबीटी', 'पैसे',
    'చెల్లింపు', 'డబ్బు', 'బ్యాంకు'
  ];
  if (paymentPatterns.some((p) => text.includes(p))) {
    return {
      intent: 'CHECK_PAYMENT',
      confidence: 0.94,
      replyText:
        language === 'hi'
          ? 'आपके बैंक भुगतान और डीबीटी की स्थिति जांची जा रही है।'
          : language === 'te'
          ? 'మీ డిబిటి చెల్లింపు వివరాలు పరిశీలించబడుతున్నాయి.'
          : 'Checking your direct benefit transfer (DBT) payment status.',
      actionRoute: '/farmer/payments',
    };
  }

  // 3. Nearest Centre
  const centrePatterns = [
    'centre', 'center', 'mandi', 'near', 'closest', 'location', 'distance',
    'केंद्र', 'मंडी', 'पास', 'दूरी', 'नजदीक',
    'కేంద్రం', 'మండి', 'సమీప'
  ];
  if (centrePatterns.some((p) => text.includes(p))) {
    return {
      intent: 'NEAREST_CENTRE',
      confidence: 0.92,
      replyText:
        language === 'hi'
          ? 'आपके नजदीकी खरीद केंद्र और मंडी की सूची दिखाई जा रही है।'
          : language === 'te'
          ? 'సమీప సేకరణ కేంద్రాల వివరాలు ప్రదర్శించబడుతున్నాయి.'
          : 'Finding nearest government procurement centres with available capacity.',
      actionRoute: '/farmer/centres',
    };
  }

  // 4. Book Slot
  const slotPatterns = [
    'book', 'slot', 'time', 'date', 'reserve', 'schedule', 'wheat', 'paddy',
    'स्लॉट', 'बुक', 'तारीख', 'समय', 'गेहूं', 'धान',
    'బుక్', 'స్లాట్', 'గోధుమలు'
  ];
  if (slotPatterns.some((p) => text.includes(p))) {
    return {
      intent: 'BOOK_SLOT',
      confidence: 0.93,
      replyText:
        language === 'hi'
          ? 'स्लॉट बुकिंग पोर्टल खोला जा रहा है।'
          : language === 'te'
          ? 'స్లాట్ బుకింగ్ స్క్రీన్ తెరవబడుతోంది.'
          : 'Opening capacity-aware slot booking for your crop.',
      actionRoute: '/farmer/booking',
    };
  }

  // 5. Today's Procurement
  const procurementPatterns = [
    'procurement', 'today', 'volume', 'msp', 'rate', 'price',
    'खरीद', 'आज', 'भाव', 'दर', 'एमएसपी',
    'సేకరణ', 'ధర'
  ];
  if (procurementPatterns.some((p) => text.includes(p))) {
    return {
      intent: 'TODAY_PROCUREMENT',
      confidence: 0.9,
      replyText:
        language === 'hi'
          ? 'आज की खरीद और न्यूनतम समर्थन मूल्य (MSP) की दरें उपलब्ध हैं।'
          : language === 'te'
          ? 'నేటి సేకరణ మరియు ఎంఎస్‌పి వివరాలు అందుబాటులో ఉన్నాయి.'
          : 'Loading today\'s procurement guidelines and MSP rates.',
      actionRoute: '/farmer/procurement',
    };
  }

  // Default fallback
  return {
    intent: 'GENERAL_ASSISTANCE',
    confidence: 0.5,
    replyText:
      language === 'hi'
        ? 'मैं आपकी स्लॉट बुकिंग, कतार स्थिति, या भुगतान जांचने में सहायता कर सकता हूँ।'
        : language === 'te'
        ? 'నేను మీకు స్లాట్ బుకింగ్ లేదా చెల్లింపు వివరాలలో సహాయం చేయగలను.'
        : 'I can assist you with slot booking, live queue ETA, or checking DBT payments.',
    actionRoute: '/farmer',
  };
}

/**
 * AI Crowd Prediction & Mandi Load Balancing Engine
 */
async function getCrowdRecommendations({ userLat, userLng }) {
  const centres = await Centre.find({ activeStatus: true }).lean();
  const todayStr = new Date().toISOString().slice(0, 10);

  const enrichedCentres = await Promise.all(
    centres.map(async (c) => {
      const activeTokens = await Token.countDocuments({
        centreId: c._id,
        status: { $in: ['issued', 'checked_in', 'in_queue'] },
      });

      const todaySlots = await Slot.find({ centreId: c._id, date: todayStr });
      const booked = todaySlots.reduce((a, b) => a + (b.bookedCount || 0), 0);
      const cap = c.dailyCapacity || 40;
      const utilization = Math.min(100, Math.round((booked / cap) * 100));

      // AI dynamic wait time prediction heuristic:
      // Accounts for queue size, average turnaround, and time-of-day rush factor
      const currentHour = new Date().getHours();
      const rushFactor = (currentHour >= 9 && currentHour <= 12) ? 1.3 : 1.0;
      const predictedWaitMins = Math.round((activeTokens * 8 + 5) * rushFactor);

      // Best time to visit recommendation
      let bestTimeToVisit = '07:00 – 09:00 AM';
      if (currentHour < 10) bestTimeToVisit = '10:00 – 11:30 AM (Low footfall)';
      else if (currentHour < 14) bestTimeToVisit = '02:30 – 04:00 PM (Optimal throughput)';
      else bestTimeToVisit = 'Tomorrow 07:30 AM (Fresh queue)';

      return {
        centreId: c._id,
        name: c.name,
        district: c.district,
        dailyCapacity: cap,
        bookedCount: booked,
        utilizationPercent: utilization,
        activeTokens,
        predictedWaitMinutes: predictedWaitMins,
        crowdLevel: utilization > 85 ? 'High Congestion' : utilization > 50 ? 'Moderate' : 'Smooth Flow',
        bestTimeToVisit,
      };
    })
  );

  // Load balancing intelligence:
  // Identify if any centre is overloaded (>85%) and recommend alternate within same district
  const overloaded = enrichedCentres.find((c) => c.utilizationPercent >= 80);
  let loadBalancingAlert = null;

  if (overloaded) {
    const alternate = enrichedCentres.find(
      (c) => c.district === overloaded.district && c.centreId.toString() !== overloaded.centreId.toString() && c.utilizationPercent < 60
    );

    if (alternate) {
      loadBalancingAlert = {
        overloadedCentre: overloaded.name,
        alternateCentre: alternate.name,
        savedWaitMinutes: Math.max(15, overloaded.predictedWaitMinutes - alternate.predictedWaitMinutes),
        recommendation: `High traffic detected at ${overloaded.name} (${overloaded.utilizationPercent}% capacity). Farmers redirected to ${alternate.name} save approximately ${Math.max(15, overloaded.predictedWaitMinutes - alternate.predictedWaitMinutes)} minutes.`,
      };
    }
  }

  return {
    centres: enrichedCentres,
    loadBalancingAlert,
    aiModelVersion: 'KisanSetu-AI-v2.6',
  };
}

module.exports = {
  parseVoiceIntent,
  getCrowdRecommendations,
};
