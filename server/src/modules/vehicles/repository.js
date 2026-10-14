const { query, withTransaction } = require('../../config/db');
const ApiError = require('../../lib/ApiError');

function mapRow(row) {
  return {
    id: Number(row.id),
    registrationNo: row.registration_no,
    vehicleType: row.vehicle_type,
    make: row.make,
    modelYear: row.model_year,
    insurancePolicy: row.insurance_policy || '',
    pollutionUpto: row.pollution_upto || null,
  };
}

async function list(userId) {
  const { rows } = await query(`SELECT * FROM vehicles WHERE user_id = $1 ORDER BY id ASC`, [userId]);
  return rows.map(mapRow);
}

async function bulkReplace(userId, vehicles) {
  try {
    return await withTransaction(async (client) => {
      const keepIds = vehicles.filter((v) => v.id != null).map((v) => Number(v.id));

      if (keepIds.length > 0) {
        await client.query(
          `DELETE FROM vehicles WHERE user_id = $1 AND id <> ALL($2::bigint[])`,
          [userId, keepIds]
        );
      } else {
        await client.query(`DELETE FROM vehicles WHERE user_id = $1`, [userId]);
      }

      // Null out (unique) reg numbers of rows being updated first, to avoid transient
      // collisions when two rows swap registration numbers within the same payload.
      for (const v of vehicles) {
        if (v.id != null) {
          await client.query(
            `UPDATE vehicles SET registration_no = CONCAT('ZZ9Z', LPAD((id % 10000)::text, 4, '0')) WHERE id = $1 AND user_id = $2`,
            [v.id, userId]
          );
        }
      }

      for (const v of vehicles) {
        if (v.id != null) {
          await client.query(
            `UPDATE vehicles
             SET registration_no = $1, vehicle_type = $2, make = $3, model_year = $4,
                 insurance_policy = $5, pollution_upto = $6
             WHERE id = $7 AND user_id = $8`,
            [v.registrationNo, v.vehicleType, v.make, v.modelYear, v.insurancePolicy || null, v.pollutionUpto || null, v.id, userId]
          );
        } else {
          await client.query(
            `INSERT INTO vehicles (user_id, registration_no, vehicle_type, make, model_year, insurance_policy, pollution_upto)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, v.registrationNo, v.vehicleType, v.make, v.modelYear, v.insurancePolicy || null, v.pollutionUpto || null]
          );
        }
      }

      const { rows } = await client.query(`SELECT * FROM vehicles WHERE user_id = $1 ORDER BY id ASC`, [userId]);
      return rows.map(mapRow);
    });
  } catch (err) {
    if (err.code === '23505' && String(err.constraint || '').includes('registration_no')) {
      throw new ApiError(409, 'DUPLICATE_REG_NO', 'That registration number is already registered.');
    }
    throw err;
  }
}

module.exports = { list, bulkReplace };
