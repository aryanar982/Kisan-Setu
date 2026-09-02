const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Farmer = require('../models/Farmer');
const Admin = require('../models/Admin');
const env = require('../config/env');

const SALT_ROUNDS = 10;

function signTokens(user, role, extra = {}) {
  const payload = { id: user._id, role, ...extra };
  const accessToken = jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn });
  const refreshToken = jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn });
  return { accessToken, refreshToken };
}

async function sendOTP({ phone }) {
  if (!phone || phone.length < 10) {
    const err = new Error('Valid 10-digit mobile number is required');
    err.status = 400;
    throw err;
  }

  // Generate 6-digit OTP (for quick testing, default '123456' is accepted as universal test OTP)
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  let farmer = await Farmer.findOne({ phone });
  if (farmer) {
    farmer.otp = { code: otpCode, expiresAt };
    await farmer.save();
  } else {
    farmer = await Farmer.create({
      phone,
      name: `Kisan ${phone.slice(-4)}`,
      otp: { code: otpCode, expiresAt },
      isVerified: false,
    });
  }

  // Simulated SMS dispatch (Phase 9 SMS integration log)
  console.log(`[SMS-GATEWAY] To: ${phone} | OTP: ${otpCode} (Expires in 10 mins)`);

  return {
    phone,
    message: 'OTP sent successfully to your mobile number',
    testOtp: otpCode, // Provided for easy demo execution
  };
}

async function verifyOTP({ phone, otp, name, village, district, state, preferredLanguage }) {
  if (!phone || !otp) {
    const err = new Error('Phone and OTP are required');
    err.status = 400;
    throw err;
  }

  const farmer = await Farmer.findOne({ phone });
  if (!farmer) {
    const err = new Error('Farmer account not found with this mobile number');
    err.status = 404;
    throw err;
  }

  // Allow standard demo OTP '123456' or the generated OTP
  const isValid =
    otp === '123456' ||
    (farmer.otp && farmer.otp.code === otp && farmer.otp.expiresAt > new Date());

  if (!isValid) {
    const err = new Error('Invalid or expired OTP');
    err.status = 400;
    throw err;
  }

  farmer.isVerified = true;
  farmer.otp = undefined;
  if (name) farmer.name = name;
  if (village) farmer.village = village;
  if (district) farmer.district = district;
  if (state) farmer.state = state;
  if (preferredLanguage) farmer.preferredLanguage = preferredLanguage;
  await farmer.save();

  const tokens = signTokens(farmer, 'farmer');
  return { farmer, ...tokens };
}

async function registerFarmer({ name, phone, password, village, district, state, crops, aadhaar }) {
  const existing = await Farmer.findOne({ phone });
  if (existing) {
    const err = new Error('An account with this phone number already exists');
    err.status = 409;
    throw err;
  }

  const passwordHash = password ? await bcrypt.hash(password, SALT_ROUNDS) : await bcrypt.hash('farmer123', SALT_ROUNDS);
  const farmer = await Farmer.create({
    name,
    phone,
    passwordHash,
    village,
    district: district || 'Sirsa',
    state: state || 'Haryana',
    crops: crops || ['Wheat'],
    aadhaar,
  });

  const tokens = signTokens(farmer, 'farmer');
  return { farmer, ...tokens };
}

async function loginFarmer({ phone, password }) {
  const farmer = await Farmer.findOne({ phone });
  if (!farmer) {
    const err = new Error('Invalid phone number or password');
    err.status = 401;
    throw err;
  }

  if (farmer.passwordHash) {
    const match = await bcrypt.compare(password, farmer.passwordHash);
    if (!match) {
      const err = new Error('Invalid phone number or password');
      err.status = 401;
      throw err;
    }
  }

  const tokens = signTokens(farmer, 'farmer');
  return { farmer, ...tokens };
}

async function loginStaff({ email, password }) {
  const admin = await Admin.findOne({ email: email.toLowerCase() }).populate('centreId');
  if (!admin) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const match = await bcrypt.compare(password, admin.passwordHash);
  if (!match) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const extra = {
    centreId: admin.centreId ? admin.centreId._id : null,
    district: admin.district,
    state: admin.state,
  };

  const tokens = signTokens(admin, admin.role, extra);
  return { staff: admin, role: admin.role, ...tokens };
}

async function getFarmerProfile(farmerId) {
  const farmer = await Farmer.findById(farmerId);
  if (!farmer) {
    const err = new Error('Farmer not found');
    err.status = 404;
    throw err;
  }
  return farmer;
}

async function updateFarmerProfile(farmerId, data) {
  const allowed = ['name', 'village', 'district', 'state', 'preferredLanguage', 'aadhaar', 'bankDetails', 'crops'];
  const update = {};
  for (const key of allowed) {
    if (data[key] !== undefined) update[key] = data[key];
  }
  return Farmer.findByIdAndUpdate(farmerId, { $set: update }, { new: true });
}

module.exports = {
  sendOTP,
  verifyOTP,
  registerFarmer,
  loginFarmer,
  loginStaff,
  getFarmerProfile,
  updateFarmerProfile,
};
