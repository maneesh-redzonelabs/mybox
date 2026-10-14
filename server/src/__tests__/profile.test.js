const { request, app, loginSeededUser, OTP } = require('./helpers');

describe('Profile', () => {
  test('GET /profile returns the seeded user with a bearer token', async () => {
    const { token } = await loginSeededUser();
    const res = await request(app).get('/api/v1/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.mobile).toBe('9999999999');
    expect(res.body.data.name).toBe('Maneesh Sharma');
  });

  test('GET /profile without a token is unauthenticated', async () => {
    const res = await request(app).get('/api/v1/profile');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  test('PUT /profile updates name/email/dob and re-syncs the Self family row', async () => {
    const { token } = await loginSeededUser();
    const res = await request(app)
      .put('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Maneesh K Sharma', email: 'maneesh.sharma@redzonelabs.in', dateOfBirth: '1985-05-10' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Maneesh K Sharma');

    const familyRes = await request(app)
      .get('/api/v1/family-members')
      .set('Authorization', `Bearer ${token}`);
    const selfRow = familyRes.body.data.find((m) => m.isSelf);
    expect(selfRow.name).toBe('Maneesh K Sharma');

    // revert so other tests relying on the seeded name keep working
    await request(app)
      .put('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Maneesh Sharma', email: 'maneesh.sharma@redzonelabs.in', dateOfBirth: '1985-05-10' });
  });

  test('POST /profile creates a new user + Self row from a verified mobile', async () => {
    const newMobile = '9000000002';
    await request(app).post('/api/v1/auth/otp/send').send({ mobile: newMobile });
    const verifyRes = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ mobile: newMobile, otp: OTP });
    const { verificationToken } = verifyRes.body.data;

    const res = await request(app)
      .post('/api/v1/profile')
      .set('Authorization', `Bearer ${verificationToken}`)
      .send({ name: 'Jane Doe', email: 'jane@example.com', dateOfBirth: '1990-02-18' });

    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.mobile).toBe(newMobile);

    const familyRes = await request(app)
      .get('/api/v1/family-members')
      .set('Authorization', `Bearer ${res.body.data.token}`);
    expect(familyRes.body.data).toHaveLength(1);
    expect(familyRes.body.data[0].relationship).toBe('Self');
    expect(familyRes.body.data[0].livingTogether).toBe('NA');
  });

  test('POST /profile rejects a mobile that already has a profile', async () => {
    const newMobile = '9000000003';
    await request(app).post('/api/v1/auth/otp/send').send({ mobile: newMobile });
    const verifyRes = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ mobile: newMobile, otp: OTP });
    const { verificationToken } = verifyRes.body.data;

    await request(app)
      .post('/api/v1/profile')
      .set('Authorization', `Bearer ${verificationToken}`)
      .send({ name: 'Dup User', email: 'dup@example.com', dateOfBirth: '1990-01-01' });

    // re-verify to get a second verification token for the same (now-registered) mobile
    await request(app).post('/api/v1/auth/otp/send').send({ mobile: newMobile });
    const verifyRes2 = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ mobile: newMobile, otp: OTP });
    expect(verifyRes2.body.data.exists).toBe(true);
  });
});
