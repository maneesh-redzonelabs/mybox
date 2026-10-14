const bcrypt = require('bcryptjs');
const env = require('../../config/env');
const ApiError = require('../../lib/ApiError');
const repo = require('./repository');
const { ConsoleSmsProvider } = require('./smsProvider');

const smsProvider = new ConsoleSmsProvider();

async function sendOtp(mobile) {
  const since = new Date(Date.now() - env.otp.rateLimitWindowSeconds * 1000);
  const recentCount = await repo.countRecentOtpRequests(mobile, since);
  if (recentCount >= env.otp.rateLimitMax) {
    throw new ApiError(429, 'RATE_LIMITED', 'Too many OTP requests. Please try again shortly.');
  }

  // Fixed/mocked OTP per the build decision, but persisted + hashed like a real flow.
  const otp = env.otp.code;
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + env.otp.ttlSeconds * 1000);

  await repo.createOtpRequest({ mobile, otpHash, expiresAt });
  await smsProvider.send(mobile, otp);

  return { mobile, otpExpiresInSeconds: env.otp.ttlSeconds };
}

async function verifyOtp(mobile, otp) {
  const latest = await repo.findLatestOtpRequest(mobile);
  if (!latest) {
    throw new ApiError(401, 'INVALID_OTP', 'OTP incorrect or expired.');
  }

  if (new Date(latest.expires_at).getTime() < Date.now()) {
    throw new ApiError(401, 'INVALID_OTP', 'OTP incorrect or expired.');
  }

  const matches = await bcrypt.compare(otp, latest.otp_hash);
  if (!matches) {
    await repo.incrementOtpAttempts(latest.id);
    throw new ApiError(401, 'INVALID_OTP', 'OTP incorrect or expired.');
  }

  return true;
}

module.exports = { sendOtp, verifyOtp };
