const { request, app, loginSeededUser } = require('./helpers');

describe('Policies', () => {
  test('GET /policies computes maturityDate and nextPremiumDate, null for Single Premium', async () => {
    const { token } = await loginSeededUser();
    const res = await request(app).get('/api/v1/policies').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const sbi = res.body.data.find((p) => p.policyNo === 'SBI-2021-00456');
    expect(sbi).toBeTruthy();
    expect(sbi.emiFrequency).toBe('Single Premium');
    expect(sbi.nextPremiumDate).toBeNull();
    expect(sbi.maturityDate).toBe('2046-01-10');

    const lic = res.body.data.find((p) => p.policyNo === 'LIC-2015-00123');
    expect(lic.maturityDate).toBe('2035-04-01');
    expect(lic.nextPremiumDate).not.toBeNull();
  });

  test('PUT /policies rejects a duplicate policyNo within the payload', async () => {
    const { token } = await loginSeededUser();
    const res = await request(app)
      .put('/api/v1/policies')
      .set('Authorization', `Bearer ${token}`)
      .send({
        policies: [
          { policyNo: 'DUP-1', bankName: 'Bank A', policyType: 'Life Insurance', startDate: '2020-01-01', policyTermYears: 10, payingTermYears: 10, emiFrequency: 'Yearly' },
          { policyNo: 'DUP-1', bankName: 'Bank B', policyType: 'Life Insurance', startDate: '2020-01-01', policyTermYears: 10, payingTermYears: 10, emiFrequency: 'Yearly' },
        ],
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_POLICY_NO');
  });

  test('PUT /policies validates enums and ranges', async () => {
    const { token } = await loginSeededUser();
    const res = await request(app)
      .put('/api/v1/policies')
      .set('Authorization', `Bearer ${token}`)
      .send({
        policies: [
          { policyNo: 'BAD-1', bankName: 'Bank A', policyType: 'Not A Type', startDate: '2020-01-01', policyTermYears: 10, payingTermYears: 10, emiFrequency: 'Yearly' },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('PUT /policies fully replaces the list', async () => {
    const { token } = await loginSeededUser();
    const res = await request(app)
      .put('/api/v1/policies')
      .set('Authorization', `Bearer ${token}`)
      .send({
        policies: [
          { policyNo: 'NEW-POLICY-1', bankName: 'New Bank', policyType: 'Health Insurance', startDate: '2022-06-01', policyTermYears: 5, payingTermYears: 5, emiFrequency: 'Monthly' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].policyNo).toBe('NEW-POLICY-1');
  });
});
