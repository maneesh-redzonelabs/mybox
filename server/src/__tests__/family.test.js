const { request, app, loginSeededUser } = require('./helpers');

describe('Family members', () => {
  test('GET /family-members returns 5 rows with Self first', async () => {
    const { token } = await loginSeededUser();
    const res = await request(app).get('/api/v1/family-members').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(5);
    expect(res.body.data[0].isSelf).toBe(true);
    expect(res.body.data[0].livingTogether).toBe('NA');
  });

  test('PUT /family-members rejects a payload containing a Self row', async () => {
    const { token } = await loginSeededUser();
    const res = await request(app)
      .put('/api/v1/family-members')
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyMembers: [
          { name: 'Hacker', relationship: 'Self', mobile: '9999999999', livingTogether: 'NA' },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('SELF_ROW_LOCKED');
  });

  test('PUT /family-members validates required fields', async () => {
    const { token } = await loginSeededUser();
    const res = await request(app)
      .put('/api/v1/family-members')
      .set('Authorization', `Bearer ${token}`)
      .send({ familyMembers: [{ name: '', relationship: 'Spouse', livingTogether: 'Yes' }] });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('PUT /family-members replaces the whole non-Self list and keeps Self derived from profile', async () => {
    const { token } = await loginSeededUser();
    const res = await request(app)
      .put('/api/v1/family-members')
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyMembers: [
          { name: 'Test Spouse', dateOfBirth: '1990-01-01', relationship: 'Spouse', mobile: '9876543211', livingTogether: 'Yes' },
        ],
      });

    expect(res.status).toBe(200);
    const nonSelf = res.body.data.filter((m) => !m.isSelf);
    expect(nonSelf).toHaveLength(1);
    expect(nonSelf[0].name).toBe('Test Spouse');
    const selfRow = res.body.data.find((m) => m.isSelf);
    expect(selfRow.mobile).toBe('9999999999');
    expect(selfRow.livingTogether).toBe('NA');
  });
});
