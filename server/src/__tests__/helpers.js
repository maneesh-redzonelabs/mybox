const request = require('supertest');
const app = require('../app');

const SEEDED_MOBILE = '9999999999';
const OTP = process.env.OTP_CODE || '123456';

async function loginSeededUser() {
  await request(app).post('/api/v1/auth/otp/send').send({ mobile: SEEDED_MOBILE });
  const res = await request(app)
    .post('/api/v1/auth/otp/verify')
    .send({ mobile: SEEDED_MOBILE, otp: OTP });
  return res.body.data; // { exists: true, token, user }
}

module.exports = { request, app, SEEDED_MOBILE, OTP, loginSeededUser };
