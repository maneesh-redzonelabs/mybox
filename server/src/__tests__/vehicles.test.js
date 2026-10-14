const { request, app, loginSeededUser } = require('./helpers');

describe('Vehicles', () => {
  test('GET /vehicles returns the seeded vehicles', async () => {
    const { token } = await loginSeededUser();
    const res = await request(app).get('/api/v1/vehicles').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  test('PUT /vehicles rejects an invalid RTO registration number', async () => {
    const { token } = await loginSeededUser();
    const res = await request(app)
      .put('/api/v1/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vehicles: [
          { registrationNo: 'NOTVALID', vehicleType: 'Car', make: 'Maruti Suzuki', modelYear: 2020 },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('PUT /vehicles rejects a duplicate registrationNo within the payload', async () => {
    const { token } = await loginSeededUser();
    const res = await request(app)
      .put('/api/v1/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vehicles: [
          { registrationNo: 'MH12AB9999', vehicleType: 'Car', make: 'Maruti Suzuki', modelYear: 2020 },
          { registrationNo: 'MH12AB9999', vehicleType: 'Bike', make: 'Honda Cars India', modelYear: 2021 },
        ],
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_REG_NO');
  });

  test('PUT /vehicles fully replaces the list', async () => {
    const { token } = await loginSeededUser();
    const res = await request(app)
      .put('/api/v1/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vehicles: [
          { registrationNo: 'KA05MN4321', vehicleType: 'Scooty', make: 'TVS Motor Company', modelYear: 2023 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].registrationNo).toBe('KA05MN4321');
  });
});
