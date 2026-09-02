const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    centreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Centre', required: true },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
    tokenNumber: { type: String, required: true, unique: true },
    qrData: { type: String }, // JSON encoded QR payload or data string
    status: {
      type: String,
      enum: ['issued', 'checked_in', 'in_queue', 'being_served', 'served', 'no_show'],
      default: 'issued',
    },
    queuePosition: { type: Number, default: 0 },
    estimatedWaitMinutes: { type: Number, default: 15 },
    checkInTime: { type: Date },
    calledAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

tokenSchema.index({ centreId: 1, status: 1, queuePosition: 1 });
tokenSchema.index({ farmerId: 1, createdAt: -1 });

module.exports = mongoose.model('Token', tokenSchema);
