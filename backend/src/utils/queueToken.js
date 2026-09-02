const Token = require('../models/Token');

// Generates a human-readable, per-centre-per-day token number, e.g.
// "CTR07-20260902-014". See architecture doc §9 for the reasoning —
// sortable, collision-free per centre/day, no separate counter collection.
async function generateTokenNumber(centreId, centreCode) {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const count = await Token.countDocuments({ centreId, createdAt: { $gte: startOfDay } });

  const sequence = String(count + 1).padStart(3, '0');
  return `${centreCode}-${dateStr}-${sequence}`;
}

module.exports = { generateTokenNumber };
