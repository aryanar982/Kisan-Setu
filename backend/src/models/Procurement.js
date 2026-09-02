const mongoose = require('mongoose');

const procurementSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
    centreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Centre', required: true },
    crop: { type: String, required: true, default: 'Wheat' },
    grossWeight: { type: Number, required: true }, // in quintals
    tareWeight: { type: Number, default: 0 },
    netWeight: { type: Number, required: true },
    acceptedQuantity: { type: Number, required: true },
    rejectedQuantity: { type: Number, default: 0 },
    rejectionReason: { type: String, trim: true },
    moisturePercentage: { type: Number, default: 11.5 },
    qualityGrade: { type: String, enum: ['Grade A', 'Grade B', 'Grade C'], default: 'Grade A' },
    pricePerUnit: { type: Number, required: true }, // MSP per quintal
    totalAmount: { type: Number, required: true },
    remarks: { type: String, trim: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
);

procurementSchema.index({ bookingId: 1 }, { unique: true });
procurementSchema.index({ centreId: 1, createdAt: -1 });
procurementSchema.index({ farmerId: 1, createdAt: -1 });

module.exports = mongoose.model('Procurement', procurementSchema);
