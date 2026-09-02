const mongoose = require('mongoose');

// Covers both platform admins and centre staff — distinguished by `role`.
// `centreId` is required for centre_staff and null for admin; enforced in
// the service layer at registration time, not here, to keep the schema simple.
const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'centre_staff'], required: true },
    centreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Centre', default: null },
  },
  { timestamps: true }
);

adminSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('Admin', adminSchema);
