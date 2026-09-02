const mongoose = require('mongoose');

const centreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true, default: 'Sirsa' },
    state: { type: String, required: true, trim: true, default: 'Haryana' },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, trim: true },
    },
    cropsAccepted: [{ type: String, trim: true }],
    dailyCapacity: { type: Number, required: true, min: 1 },
    operatingHours: {
      start: { type: String, default: '07:00' },
      end: { type: String, default: '18:00' },
    },
    officerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }],
    contactPhone: { type: String, default: '01666-224411' },
    currentQueueCount: { type: Number, default: 0 },
    averageWaitTimeMinutes: { type: Number, default: 20 },
    activeStatus: { type: Boolean, default: true },
  },
  { timestamps: true }
);

centreSchema.index({ district: 1, activeStatus: 1 });

module.exports = mongoose.model('Centre', centreSchema);
