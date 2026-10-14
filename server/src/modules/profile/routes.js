const express = require('express');
const { requireAuth, requireVerifiedMobile } = require('../../middleware/auth');
const controller = require('./controller');

const router = express.Router();

router.post('/profile', requireVerifiedMobile, controller.createProfile);
router.get('/profile', requireAuth, controller.getProfile);
router.put('/profile', requireAuth, controller.putProfile);

module.exports = router;
