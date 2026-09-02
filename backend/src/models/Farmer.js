const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    village: { type: String, trim: true },
    crops: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

// Never let a password hash leak into a JSON response by accident.
farmerSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('Farmer', farmerSchema);
