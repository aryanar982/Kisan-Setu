const Procurement = require('../models/Procurement');
const Booking = require('../models/Booking');
const Token = require('../models/Token');
const Payment = require('../models/Payment');
const { getMspRates } = require('./crop.service');
const { createNotification } = require('./notification.service');
const { emitQueueUpdate } = require('./queue.service');

async function recordProcurement({
  bookingId,
  grossWeight,
  tareWeight = 0,
  rejectedQuantity = 0,
  rejectionReason,
  moisturePercentage = 11.5,
  qualityGrade = 'Grade A',
  remarks,
  officerId,
}) {
  const booking = await Booking.findById(bookingId).populate('farmerId centreId');
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }

  const gross = Number(grossWeight);
  const tare = Number(tareWeight) || 0;
  const netWeight = Math.max(0, gross - tare);
  const rejected = Number(rejectedQuantity) || 0;
  const acceptedQuantity = Math.max(0, netWeight - rejected);

  if (acceptedQuantity <= 0) {
    const err = new Error('Accepted quantity must be greater than zero');
    err.status = 400;
    throw err;
  }

  const mspRates = await getMspRates();
  const crop = booking.cropType || 'Wheat';
  const pricePerUnit = mspRates[crop] || 2425;
  const totalAmount = Math.round(acceptedQuantity * pricePerUnit);

  const procurement = await Procurement.create({
    bookingId: booking._id,
    farmerId: booking.farmerId._id,
    centreId: booking.centreId._id,
    crop,
    grossWeight: gross,
    tareWeight: tare,
    netWeight,
    acceptedQuantity,
    rejectedQuantity: rejected,
    rejectionReason,
    moisturePercentage: Number(moisturePercentage) || 11.5,
    qualityGrade,
    pricePerUnit,
    totalAmount,
    remarks,
    recordedBy: officerId,
  });

  // Mark token as served and booking as completed
  await Token.findOneAndUpdate({ bookingId: booking._id }, { status: 'served', completedAt: new Date() });
  booking.status = 'completed';
  await booking.save();

  // Instant Payment Trigger (Phase 6 / 11)
  const dbtRef = `DBT${new Date().getFullYear()}${Math.floor(100000 + Math.random() * 900000)}`;
  const payment = await Payment.create({
    procurementId: procurement._id,
    farmerId: booking.farmerId._id,
    bookingId: booking._id,
    centreId: booking.centreId._id,
    amount: totalAmount,
    status: 'initiated',
    mode: 'DBT',
    transactionId: dbtRef,
    bankAccountMasked: booking.farmerId.bankDetails ? `XXXX-XXXX-${booking.farmerId.bankDetails.accountNo.slice(-4)}` : 'XXXX-XXXX-1298',
    bankIfsc: booking.farmerId.bankDetails ? booking.farmerId.bankDetails.ifsc : 'SBIN0001428',
  });

  // Multi-channel notification dispatch
  await createNotification({
    recipientId: booking.farmerId._id,
    recipientRole: 'Farmer',
    title: '🌾 Procurement Completed',
    message: `Your produce of ${acceptedQuantity} Qtl ${crop} was accepted at ₹${pricePerUnit}/Qtl. Total ₹${totalAmount.toLocaleString('en-IN')}.`,
    type: 'PROCUREMENT_COMPLETE',
    channel: 'all',
    metadata: { procurementId: procurement._id, totalAmount },
  });

  await createNotification({
    recipientId: booking.farmerId._id,
    recipientRole: 'Farmer',
    title: '💳 DBT Payment Initiated',
    message: `Payment of ₹${totalAmount.toLocaleString('en-IN')} has been initiated via Direct Benefit Transfer (Ref: ${dbtRef}).`,
    type: 'PAYMENT_INITIATED',
    channel: 'all',
    metadata: { paymentId: payment._id, transactionId: dbtRef },
  });

  emitQueueUpdate(booking.centreId._id);

  return { procurement, payment };
}

async function getProcurementByBooking(bookingId) {
  return Procurement.findOne({ bookingId }).populate('farmerId centreId recordedBy');
}

async function listProcurements({ centreId, farmerId }) {
  const query = {};
  if (centreId) query.centreId = centreId;
  if (farmerId) query.farmerId = farmerId;
  return Procurement.find(query).populate('farmerId centreId').sort({ createdAt: -1 });
}

module.exports = {
  recordProcurement,
  getProcurementByBooking,
  listProcurements,
};
