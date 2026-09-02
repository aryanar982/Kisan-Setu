const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const centreController = require('../controllers/centre.controller');

const router = express.Router();

router.get('/', asyncHandler(centreController.listCentres));
router.get('/:id', asyncHandler(centreController.getCentre));

// Officer/Admin only endpoints
router.post('/', requireAuth, rbac(['admin', 'state_admin', 'district_admin']), asyncHandler(centreController.createCentre));
router.put('/:id', requireAuth, rbac(['admin', 'state_admin', 'district_admin', 'centre_staff']), asyncHandler(centreController.updateCentre));

module.exports = router;
