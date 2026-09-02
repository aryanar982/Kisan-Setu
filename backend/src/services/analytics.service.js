const Farmer = require('../models/Farmer');
const Centre = require('../models/Centre');
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const Token = require('../models/Token');
const Procurement = require('../models/Procurement');
const Payment = require('../models/Payment');

async function getAdminOverview() {
  const todayStr = new Date().toISOString().slice(0, 10);

  // High-level counts
  const totalFarmers = await Farmer.countDocuments();
  const centres = await Centre.find({ activeStatus: true }).lean();

  const todaysSlots = await Slot.find({ date: todayStr }).lean();
  const slotsBookedToday = todaysSlots.reduce((acc, s) => acc + (s.bookedCount || 0), 0);
  const totalCapacityToday = todaysSlots.reduce((acc, s) => acc + (s.capacity || 0), 0) || 1;

  const todayTokens = await Token.find({
    createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
  }).lean();

  const farmersToday = todayTokens.filter((t) => t.status === 'served' || t.status === 'being_served').length;

  // Payments aggregation
  const completedPayments = await Payment.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const totalPaymentsDisbursed = completedPayments[0]?.total || 0;

  const pendingPayments = await Payment.aggregate([
    { $match: { status: { $in: ['initiated', 'processing'] } } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const pendingPaymentsAmount = pendingPayments[0]?.total || 0;

  // Procurement volume aggregation
  const volumeAgg = await Procurement.aggregate([
    { $group: { _id: null, total: { $sum: '$acceptedQuantity' }, count: { $sum: 1 } } },
  ]);
  const totalVolumeQuintals = volumeAgg[0]?.total || 0;

  // Average wait time
  const tokensWithWait = await Token.find({ status: 'served', estimatedWaitMinutes: { $gt: 0 } }).lean();
  const avgWait = tokensWithWait.length > 0
    ? Math.round(tokensWithWait.reduce((a, b) => a + b.estimatedWaitMinutes, 0) / tokensWithWait.length)
    : 18;

  // Centre performance comparison (Bar Chart & Utilization)
  const centrePerformance = await Promise.all(
    centres.map(async (c) => {
      const cSlots = todaysSlots.filter((s) => s.centreId.toString() === c._id.toString());
      const booked = cSlots.reduce((acc, s) => acc + (s.bookedCount || 0), 0);
      const cap = c.dailyCapacity || 40;
      const utilization = Math.min(100, Math.round((booked / cap) * 100));

      const cProc = await Procurement.aggregate([
        { $match: { centreId: c._id } },
        { $group: { _id: null, total: { $sum: '$acceptedQuantity' } } },
      ]);

      return {
        centreId: c._id,
        name: c.name,
        district: c.district,
        dailyCapacity: cap,
        bookedCount: booked,
        utilizationPercent: utilization,
        currentQueue: c.currentQueueCount || 0,
        procuredQuintals: cProc[0]?.total || 0,
        status: utilization >= 90 ? 'Critical' : utilization >= 70 ? 'Optimal' : 'Underutilized',
      };
    })
  );

  // Past 7 days volume trend (Line Chart)
  const past7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    past7Days.push({ date: dStr, day: dayLabel, volume: 0 });
  }

  const procurementsLast7 = await Procurement.find({
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  }).lean();

  procurementsLast7.forEach((p) => {
    const pDate = p.createdAt.toISOString().slice(0, 10);
    const match = past7Days.find((d) => d.date === pDate);
    if (match) match.volume += p.acceptedQuantity;
  });

  // Crop distribution (Pie Chart)
  const cropDistribution = await Procurement.aggregate([
    { $group: { _id: '$crop', totalQuantity: { $sum: '$acceptedQuantity' }, count: { $sum: 1 } } },
  ]);

  // Quality Grade distribution (Pie/Doughnut Chart)
  const qualityDistribution = await Procurement.aggregate([
    { $group: { _id: '$qualityGrade', count: { $sum: 1 } } },
  ]);

  // District Heatmap / Congestion metrics
  const districtMap = {};
  centrePerformance.forEach((cp) => {
    if (!districtMap[cp.district]) {
      districtMap[cp.district] = { district: cp.district, totalCentres: 0, totalCapacity: 0, totalBooked: 0, activeQueue: 0 };
    }
    districtMap[cp.district].totalCentres += 1;
    districtMap[cp.district].totalCapacity += cp.dailyCapacity;
    districtMap[cp.district].totalBooked += cp.bookedCount;
    districtMap[cp.district].activeQueue += cp.currentQueue;
  });

  const districtHeatmap = Object.values(districtMap).map((d) => ({
    ...d,
    congestionScore: Math.min(100, Math.round((d.totalBooked / (d.totalCapacity || 1)) * 100)),
  }));

  return {
    kpis: {
      totalFarmers,
      farmersToday,
      slotsBookedToday,
      totalCapacityToday,
      capacityUtilization: Math.round((slotsBookedToday / totalCapacityToday) * 100),
      totalVolumeQuintals,
      totalPaymentsDisbursed,
      pendingPaymentsAmount,
      averageWaitMinutes: avgWait,
    },
    centrePerformance,
    procurementTrends: past7Days,
    cropDistribution: cropDistribution.map((c) => ({ crop: c._id || 'Wheat', quantity: c.totalQuantity })),
    qualityDistribution: qualityDistribution.map((q) => ({ grade: q._id || 'Grade A', count: q.count })),
    districtHeatmap,
  };
}

module.exports = { getAdminOverview };
