const { request, app, loginSeededUser } = require('./helpers');

describe('Dashboard summary', () => {
  test('GET /dashboard/summary returns counts', async () => {
    const { token } = await loginSeededUser();
    const res = await request(app).get('/api/v1/dashboard/summary').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.data.familyMembers).toBe('number');
    expect(typeof res.body.data.policies).toBe('number');
    expect(typeof res.body.data.vehicles).toBe('number');
  });
});
