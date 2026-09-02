const mongoose = require('mongoose');

const centreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String, trim: true },
    },
    cropsAccepted: [{ type: String, trim: true }],
    dailyCapacity: { type: Number, required: true, min: 1 },
    operatingHours: {
      start: { type: String, default: '07:00' },
      end: { type: String, default: '18:00' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Centre', centreSchema);
