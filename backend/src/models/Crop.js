const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema(
  {
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
    cropType: { type: String, required: true, trim: true },
    variety: { type: String, trim: true },
    estimatedQuantity: { type: Number, required: true, min: 0.1 }, // in quintals
    harvestSeason: { type: String, default: 'Rabi 2026' },
    mspPerQuintal: { type: Number, required: true }, // in INR
    landAreaAcres: { type: Number, default: 2.5 },
    status: {
      type: String,
      enum: ['registered', 'verified', 'harvested', 'procured'],
      default: 'registered',
    },
  },
  { timestamps: true }
);

cropSchema.index({ farmerId: 1, cropType: 1 });

module.exports = mongoose.model('Crop', cropSchema);
