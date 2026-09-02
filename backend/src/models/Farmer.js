const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String },
    aadhaar: { type: String, trim: true },
    address: { type: String, trim: true },
    village: { type: String, trim: true },
    district: { type: String, trim: true, default: 'Sirsa' },
    state: { type: String, trim: true, default: 'Haryana' },
    preferredLanguage: { type: String, enum: ['hi', 'en', 'te'], default: 'hi' },
    crops: [{ type: String, trim: true }],
    bankDetails: {
      accountNo: { type: String, default: '918237461298' },
      ifsc: { type: String, default: 'SBIN0001428' },
      bankName: { type: String, default: 'State Bank of India' },
    },
    isVerified: { type: Boolean, default: true },
    otp: {
      code: { type: String },
      expiresAt: { type: Date },
    },
  },
  { timestamps: true }
);

// Never let password hash or active OTP leak into a JSON response
farmerSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.otp;
  return obj;
};

module.exports = mongoose.model('Farmer', farmerSchema);
