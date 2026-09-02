const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
    centreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Centre', required: true },
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
    status: {
      type: String,
      enum: ['booked', 'checked_in', 'cancelled', 'no_show', 'completed'],
      default: 'booked',
    },
  },
  { timestamps: true }
);

bookingSchema.index({ slotId: 1, status: 1 });
bookingSchema.index({ farmerId: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
