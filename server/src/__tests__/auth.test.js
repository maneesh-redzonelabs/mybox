const { request, app, SEEDED_MOBILE, OTP } = require('./helpers');

describe('Auth: OTP send/verify', () => {
  test('POST /auth/otp/send rejects invalid mobile', async () => {
    const res = await request(app).post('/api/v1/auth/otp/send').send({ mobile: '12345' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('POST /auth/otp/send succeeds for valid mobile', async () => {
    const res = await request(app).post('/api/v1/auth/otp/send').send({ mobile: SEEDED_MOBILE });
    expect(res.status).toBe(200);
    expect(res.body.data.mobile).toBe(SEEDED_MOBILE);
    expect(res.body.data.otpExpiresInSeconds).toBeGreaterThan(0);
  });

  test('POST /auth/otp/verify returns exists:true + token for the seeded user', async () => {
    await request(app).post('/api/v1/auth/otp/send').send({ mobile: SEEDED_MOBILE });
    const res = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ mobile: SEEDED_MOBILE, otp: OTP });

    expect(res.status).toBe(200);
    expect(res.body.data.exists).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.mobile).toBe(SEEDED_MOBILE);
    expect(res.body.data.user.name).toBe('Maneesh Sharma');
  });

  test('POST /auth/otp/verify rejects a wrong OTP', async () => {
    await request(app).post('/api/v1/auth/otp/send').send({ mobile: SEEDED_MOBILE });
    const res = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ mobile: SEEDED_MOBILE, otp: '000000' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_OTP');
  });

  test('POST /auth/otp/verify returns exists:false + verificationToken for a brand new mobile', async () => {
    const newMobile = '9000000001';
    await request(app).post('/api/v1/auth/otp/send').send({ mobile: newMobile });
    const res = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ mobile: newMobile, otp: OTP });

    expect(res.status).toBe(200);
    expect(res.body.data.exists).toBe(false);
    expect(res.body.data.verificationToken).toBeTruthy();
  });

  test('rate limits repeated OTP sends within the window', async () => {
    // Seed otp_requests directly (fast, and independent of other tests' shared usage
    // of the global per-mobile rate-limit budget) to simulate hitting the limit.
    const { pool } = require('../config/db');
    const env = require('../config/env');
    const mobile = '9000000199';

    const values = [];
    const params = [];
    for (let i = 0; i < env.otp.rateLimitMax; i++) {
      params.push(mobile, 'x', new Date(Date.now() + 5 * 60 * 1000));
      values.push(`($${params.length - 2}, $${params.length - 1}, $${params.length})`);
    }
    await pool.query(
      `INSERT INTO otp_requests (mobile, otp_hash, expires_at) VALUES ${values.join(',')}`,
      params
    );

    const res = await request(app).post('/api/v1/auth/otp/send').send({ mobile });
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });
});
