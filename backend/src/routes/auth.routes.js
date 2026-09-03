const express = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { asyncHandler } = require('../middleware/errorHandler');
const authController = require('../controllers/auth.controller');

const router = express.Router();

const otpSendSchema = z.object({
  phone: z.string().min(10).max(15),
});

const otpVerifySchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().min(4).max(6),
  name: z.string().optional(),
  village: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  preferredLanguage: z.enum(['hi', 'en', 'te']).optional(),
  role: z.literal('farmer'),
});

const registerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10).max(15),
  password: z.string().min(4).optional(),
  village: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  crops: z.array(z.string()).optional(),
  aadhaar: z.string().optional(),
});

const loginSchema = z.object({
  phone: z.string().min(10).max(15),
  password: z.string().min(4),
  role: z.literal('farmer'),
});

const staffLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
  role: z.enum(['officer', 'admin', 'district_admin', 'state_admin']),
});

router.post('/otp/send', validate(otpSendSchema), asyncHandler(authController.sendOtp));
router.post('/otp/verify', validate(otpVerifySchema), asyncHandler(authController.verifyOtp));
router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/staff/login', validate(staffLoginSchema), asyncHandler(authController.staffLogin));

router.get('/profile', requireAuth, rbac(['farmer']), asyncHandler(authController.getProfile));
router.put('/profile', requireAuth, rbac(['farmer']), asyncHandler(authController.updateProfile));

module.exports = router;
