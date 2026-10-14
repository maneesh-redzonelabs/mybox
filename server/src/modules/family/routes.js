const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const controller = require('./controller');

const router = express.Router();

router.get('/family-members', requireAuth, controller.getFamilyMembers);
router.put('/family-members', requireAuth, controller.putFamilyMembers);

module.exports = router;
