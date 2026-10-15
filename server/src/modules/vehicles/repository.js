const { query, withTransaction } = require('../../config/db');
const { encryptField, decryptField, hashForLookup } = require('../../lib/crypto');
const ApiError = require('../../lib/ApiError');

function mapRow(row) {
  return {
    id: Number(row.id),
    registrationNo: decryptField(row.registration_no),
    vehicleType: row.vehicle_type,
    make: row.make,
    modelYear: row.model_year,
    insurancePolicy: decryptField(row.insurance_policy) || '',
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

      // Null out (unique) reg numbers/hash of rows being updated first, to avoid transient
      // collisions when two rows swap registration numbers within the same payload. Uniqueness
      // lives on registration_no_hash now, so the temp hash must also be distinct per row --
      // the row id (globally unique) guarantees that.
      for (const v of vehicles) {
        if (v.id != null) {
          await client.query(
            `UPDATE vehicles
             SET registration_no = CONCAT('ZZ9Z', LPAD((id % 10000)::text, 4, '0')),
                 registration_no_hash = CONCAT('__tmp__', id)
             WHERE id = $1 AND user_id = $2`,
            [v.id, userId]
          );
        }
      }

      for (const v of vehicles) {
        const encryptedRegNo = encryptField(v.registrationNo);
        const regNoHash = hashForLookup(v.registrationNo);
        const encryptedInsurancePolicy = encryptField(v.insurancePolicy || null);
        if (v.id != null) {
          await client.query(
            `UPDATE vehicles
             SET registration_no = $1, registration_no_hash = $2, vehicle_type = $3, make = $4, model_year = $5,
                 insurance_policy = $6, pollution_upto = $7
             WHERE id = $8 AND user_id = $9`,
            [encryptedRegNo, regNoHash, v.vehicleType, v.make, v.modelYear, encryptedInsurancePolicy, v.pollutionUpto || null, v.id, userId]
          );
        } else {
          await client.query(
            `INSERT INTO vehicles (user_id, registration_no, registration_no_hash, vehicle_type, make, model_year, insurance_policy, pollution_upto)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [userId, encryptedRegNo, regNoHash, v.vehicleType, v.make, v.modelYear, encryptedInsurancePolicy, v.pollutionUpto || null]
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
