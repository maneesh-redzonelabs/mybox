const { query, withTransaction } = require('../../config/db');
const { calcNextPremiumDate } = require('../../lib/dateCalc');
const ApiError = require('../../lib/ApiError');

function mapRow(row) {
  return {
    id: Number(row.id),
    policyNo: row.policy_no,
    bankName: row.bank_name,
    policyType: row.policy_type,
    startDate: row.start_date,
    policyTermYears: row.policy_term_years,
    payingTermYears: row.paying_term_years,
    emiFrequency: row.emi_frequency,
    maturityDate: row.maturity_date || null,
    nextPremiumDate: calcNextPremiumDate(row.start_date, row.emi_frequency),
  };
}

async function list(userId) {
  const { rows } = await query(
    `SELECT * FROM v_policies WHERE user_id = $1 ORDER BY id ASC`,
    [userId]
  );
  return rows.map(mapRow);
}

async function bulkReplace(userId, policies) {
  try {
    return await withTransaction(async (client) => {
      const keepIds = policies.filter((p) => p.id != null).map((p) => Number(p.id));

      if (keepIds.length > 0) {
        await client.query(
          `DELETE FROM policies WHERE user_id = $1 AND id <> ALL($2::bigint[])`,
          [userId, keepIds]
        );
      } else {
        await client.query(`DELETE FROM policies WHERE user_id = $1`, [userId]);
      }

      // Null out policy_no for rows being updated first, to avoid transient unique
      // collisions when two rows swap policy numbers within the same payload.
      for (const p of policies) {
        if (p.id != null) {
          await client.query(`UPDATE policies SET policy_no = CONCAT('__tmp__', id) WHERE id = $1 AND user_id = $2`, [p.id, userId]);
        }
      }

      for (const p of policies) {
        if (p.id != null) {
          await client.query(
            `UPDATE policies
             SET policy_no = $1, bank_name = $2, policy_type = $3, start_date = $4,
                 policy_term_years = $5, paying_term_years = $6, emi_frequency = $7
             WHERE id = $8 AND user_id = $9`,
            [p.policyNo, p.bankName, p.policyType, p.startDate, p.policyTermYears, p.payingTermYears, p.emiFrequency, p.id, userId]
          );
        } else {
          await client.query(
            `INSERT INTO policies (user_id, policy_no, bank_name, policy_type, start_date, policy_term_years, paying_term_years, emi_frequency)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [userId, p.policyNo, p.bankName, p.policyType, p.startDate, p.policyTermYears, p.payingTermYears, p.emiFrequency]
          );
        }
      }

      const { rows } = await client.query(
        `SELECT * FROM v_policies WHERE user_id = $1 ORDER BY id ASC`,
        [userId]
      );
      return rows.map(mapRow);
    });
  } catch (err) {
    if (err.code === '23505' && String(err.constraint || '').includes('policy_no')) {
      throw new ApiError(409, 'DUPLICATE_POLICY_NO', 'That policy number is already used in your list.');
    }
    throw err;
  }
}

module.exports = { list, bulkReplace };
