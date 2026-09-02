const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    centreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Centre', required: true },
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    startTime: { type: String, required: true }, // 'HH:mm'
    endTime: { type: String, required: true },
    capacity: { type: Number, required: true, min: 1 },
    bookedCount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['open', 'full', 'closed'],
      default: 'open',
    },
  },
  { timestamps: true }
);

slotSchema.index({ centreId: 1, date: 1 });

module.exports = mongoose.model('Slot', slotSchema);
