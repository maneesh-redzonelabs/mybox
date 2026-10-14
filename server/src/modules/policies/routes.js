const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const controller = require('./controller');

const router = express.Router();

router.get('/policies', requireAuth, controller.getPolicies);
router.put('/policies', requireAuth, controller.putPolicies);

module.exports = router;
