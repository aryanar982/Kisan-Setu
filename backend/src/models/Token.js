const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    centreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Centre', required: true },
    tokenNumber: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['issued', 'in_queue', 'being_served', 'served'],
      default: 'issued',
    },
    queuePosition: { type: Number },
    calledAt: { type: Date },
  },
  { timestamps: true }
);

// Powers the "who's next" query on the centre queue screen.
tokenSchema.index({ centreId: 1, status: 1, queuePosition: 1 });

module.exports = mongoose.model('Token', tokenSchema);
