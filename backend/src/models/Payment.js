const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    procurementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Procurement', required: true },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed'],
      default: 'pending',
    },
    mode: { type: String },
    transactionRef: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
