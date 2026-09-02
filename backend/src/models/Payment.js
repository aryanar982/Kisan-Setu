const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    procurementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Procurement', required: true },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    centreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Centre' },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['initiated', 'processing', 'completed', 'failed'],
      default: 'initiated',
    },
    mode: { type: String, default: 'DBT' },
    transactionId: { type: String, unique: true },
    bankAccountMasked: { type: String, default: 'XXXX-XXXX-1298' },
    bankIfsc: { type: String, default: 'SBIN0001428' },
    failureReason: { type: String },
    disbursedAt: { type: Date },
  },
  { timestamps: true }
);

paymentSchema.index({ farmerId: 1, createdAt: -1 });
paymentSchema.index({ centreId: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
