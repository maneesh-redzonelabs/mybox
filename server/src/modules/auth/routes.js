const express = require('express');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const ApiError = require('../../lib/ApiError');
const { isValidMobile } = require('../../lib/validators');
const { mapUser } = require('../../lib/mappers');
const { signToken } = require('../../middleware/auth');
const otpService = require('./otpService');
const repo = require('./repository');

const router = express.Router();

router.post('/auth/otp/send', async (req, res, next) => {
  try {
    const { mobile } = req.body || {};
    if (!isValidMobile(mobile)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Please enter a valid 10-digit mobile number.', {
        mobile: 'Must be exactly 10 digits',
      });
    }
    const result = await otpService.sendOtp(mobile);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/auth/otp/verify', async (req, res, next) => {
  try {
    const { mobile, otp } = req.body || {};
    if (!isValidMobile(mobile) || typeof otp !== 'string' || !/^[0-9]{6}$/.test(otp)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Please enter the complete 6-digit OTP.');
    }

    await otpService.verifyOtp(mobile, otp);

    const user = await repo.findUserByMobile(mobile);
    if (user) {
      const token = signToken(user);
      return res.status(200).json({ data: { exists: true, token, user: mapUser(user) } });
    }

    // Short-lived "verified mobile" token so POST /profile can trust this mobile
    // without yet having a user row / full bearer session.
    const verificationToken = jwt.sign({ purpose: 'profile_creation', mobile }, env.jwt.secret, {
      expiresIn: '15m',
    });

    res.status(200).json({ data: { exists: false, verificationToken } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
