const authService = require('../services/auth.service');
const { ok } = require('../utils/apiResponse');

async function register(req, res) {
  const { farmer, accessToken, refreshToken } = await authService.registerFarmer(req.body);
  return ok(res, { farmer, accessToken, refreshToken }, 'Account created', 201);
}

async function login(req, res) {
  const { farmer, accessToken, refreshToken } = await authService.loginFarmer(req.body);
  return ok(res, { farmer, accessToken, refreshToken }, 'Logged in');
}

module.exports = { register, login };
