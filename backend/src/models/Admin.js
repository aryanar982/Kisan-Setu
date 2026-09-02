const mongoose = require('mongoose');

// Covers Procurement Officers, District Admins, and State Admins
const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['centre_staff', 'district_admin', 'state_admin', 'admin'],
      required: true,
      default: 'centre_staff',
    },
    centreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Centre', default: null },
    district: { type: String, trim: true, default: 'Sirsa' },
    state: { type: String, trim: true, default: 'Haryana' },
  },
  { timestamps: true }
);

adminSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('Admin', adminSchema);
