const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const controller = require('./controller');

const router = express.Router();

router.get('/vehicles', requireAuth, controller.getVehicles);
router.put('/vehicles', requireAuth, controller.putVehicles);

module.exports = router;
