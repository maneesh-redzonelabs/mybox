const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const controller = require('./controller');

const router = express.Router();

router.get('/dashboard/summary', requireAuth, controller.getSummary);

module.exports = router;
