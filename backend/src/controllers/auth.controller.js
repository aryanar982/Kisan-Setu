const authService = require('../services/auth.service');
const { ok } = require('../utils/apiResponse');

async function sendOtp(req, res) {
  const result = await authService.sendOTP(req.body);
  return ok(res, result, 'OTP sent');
}

async function verifyOtp(req, res) {
  const result = await authService.verifyOTP(req.body);
  return ok(res, result, 'OTP verified successfully');
}

async function register(req, res) {
  const result = await authService.registerFarmer(req.body);
  return ok(res, result, 'Account created', 201);
}

async function login(req, res) {
  const result = await authService.loginFarmer(req.body);
  return ok(res, result, 'Logged in');
}

async function staffLogin(req, res) {
  const result = await authService.loginStaff(req.body);
  return ok(res, result, 'Staff authenticated');
}

async function getProfile(req, res) {
  const farmer = await authService.getFarmerProfile(req.user.id);
  return ok(res, farmer, 'Profile retrieved');
}

async function updateProfile(req, res) {
  const updated = await authService.updateFarmerProfile(req.user.id, req.body);
  return ok(res, updated, 'Profile updated');
}

module.exports = {
  sendOtp,
  verifyOtp,
  register,
  login,
  staffLogin,
  getProfile,
  updateProfile,
};
