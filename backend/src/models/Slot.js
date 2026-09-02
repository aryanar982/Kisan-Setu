const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    centreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Centre', required: true },
    date: { type: String, required: true }, // 'YYYY-MM-DD' — simple and index-friendly
    startTime: { type: String, required: true }, // 'HH:mm'
    endTime: { type: String, required: true },
    capacity: { type: Number, required: true, min: 1 },
    bookedCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Matches §5 of the architecture doc: this is the index that keeps
// "give me today's slots for this centre" fast as data grows.
slotSchema.index({ centreId: 1, date: 1 });

module.exports = mongoose.model('Slot', slotSchema);
