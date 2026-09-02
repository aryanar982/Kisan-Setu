const express = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const authController = require('../controllers/auth.controller');

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10).max(15),
  password: z.string().min(6),
  village: z.string().optional(),
  crops: z.array(z.string()).optional(),
});

const loginSchema = z.object({
  phone: z.string().min(10).max(15),
  password: z.string().min(6),
});

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));

module.exports = router;
