const { query } = require('../../config/db');

async function createOtpRequest({ mobile, otpHash, expiresAt }) {
  await query(
    `INSERT INTO otp_requests (mobile, otp_hash, expires_at) VALUES ($1, $2, $3)`,
    [mobile, otpHash, expiresAt]
  );
}

async function countRecentOtpRequests(mobile, sinceDate) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS count FROM otp_requests WHERE mobile = $1 AND created_at >= $2`,
    [mobile, sinceDate]
  );
  return rows[0].count;
}

async function findLatestOtpRequest(mobile) {
  const { rows } = await query(
    `SELECT * FROM otp_requests WHERE mobile = $1 ORDER BY created_at DESC LIMIT 1`,
    [mobile]
  );
  return rows[0] || null;
}

async function incrementOtpAttempts(id) {
  await query(`UPDATE otp_requests SET attempts = attempts + 1 WHERE id = $1`, [id]);
}

async function findUserByMobile(mobile) {
  const { rows } = await query(`SELECT * FROM users WHERE mobile = $1`, [mobile]);
  return rows[0] || null;
}

module.exports = {
  createOtpRequest,
  countRecentOtpRequests,
  findLatestOtpRequest,
  incrementOtpAttempts,
  findUserByMobile,
};
