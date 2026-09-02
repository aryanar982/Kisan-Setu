const mongoose = require('mongoose');

// Not wired into a route in this scaffold — booking is the reference flow.
// This model exists so the schema is frozen and whoever builds the
// procurement endpoints next doesn't have to guess field names.
const procurementSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
    centreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Centre', required: true },
    crop: { type: String, required: true },
    quantity: { type: Number, required: true },
    grade: { type: String },
    pricePerUnit: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Procurement', procurementSchema);
