const express = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const cropController = require('../controllers/crop.controller');

const router = express.Router();

const cropCreateSchema = z.object({
  cropType: z.string().min(2),
  variety: z.string().optional(),
  estimatedQuantity: z.number().min(0.1),
  harvestSeason: z.string().optional(),
  landAreaAcres: z.number().optional(),
});

router.post('/', requireAuth, validate(cropCreateSchema), asyncHandler(cropController.createCrop));
router.get('/my', requireAuth, asyncHandler(cropController.getMyCrops));
router.get('/msp-rates', asyncHandler(cropController.getMspRates));

module.exports = router;
