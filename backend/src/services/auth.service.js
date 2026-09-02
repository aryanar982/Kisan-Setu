const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Farmer = require('../models/Farmer');
const env = require('../config/env');

const SALT_ROUNDS = 10;

function signTokens(user, role) {
  const payload = { id: user._id, role };
  const accessToken = jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn });
  const refreshToken = jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn });
  return { accessToken, refreshToken };
}

async function registerFarmer({ name, phone, password, village, crops }) {
  const existing = await Farmer.findOne({ phone });
  if (existing) {
    const err = new Error('An account with this phone number already exists');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const farmer = await Farmer.create({ name, phone, passwordHash, village, crops });
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

  const match = await bcrypt.compare(password, farmer.passwordHash);
  if (!match) {
    const err = new Error('Invalid phone number or password');
    err.status = 401;
    throw err;
  }

  const tokens = signTokens(farmer, 'farmer');
  return { farmer, ...tokens };
}

module.exports = { registerFarmer, loginFarmer };

// NOTE for whoever extends this next: centre_staff / admin login follows
// the identical pattern against the Admin model, just swapping in
// `role: admin.role` (since Admin can be either role) instead of a
// hardcoded 'farmer' string. Keep it as a sibling function here, e.g.
// `loginStaff({ email, password })`, rather than branching inside
// loginFarmer — one function per actor keeps each one easy to read.
