const { query, withTransaction } = require('../../config/db');

async function findById(id) {
  const { rows } = await query(`SELECT * FROM users WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function findByMobile(mobile) {
  const { rows } = await query(`SELECT * FROM users WHERE mobile = $1`, [mobile]);
  return rows[0] || null;
}

/** Creates the user and seeds exactly one Self family member row, in one transaction. */
async function createUserWithSelfRow({ mobile, name, email, dateOfBirth }) {
  return withTransaction(async (client) => {
    const { rows: userRows } = await client.query(
      `INSERT INTO users (mobile, name, email, date_of_birth)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [mobile, name, email, dateOfBirth || null]
    );
    const user = userRows[0];

    await client.query(
      `INSERT INTO family_members (user_id, name, date_of_birth, relationship, mobile, living_together)
       VALUES ($1, $2, $3, 'Self', $4, 'NA')`,
      [user.id, name, dateOfBirth || null, mobile]
    );

    return user;
  });
}

/** Updates profile fields and re-syncs the Self family row in the same transaction. */
async function updateProfile(userId, { name, email, dateOfBirth }) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE users SET name = $1, email = $2, date_of_birth = $3 WHERE id = $4 RETURNING *`,
      [name, email, dateOfBirth || null, userId]
    );
    const user = rows[0];

    await client.query(
      `UPDATE family_members
       SET name = $1, date_of_birth = $2, mobile = $3
       WHERE user_id = $4 AND relationship = 'Self'`,
      [name, dateOfBirth || null, user.mobile, userId]
    );

    return user;
  });
}

module.exports = { findById, findByMobile, createUserWithSelfRow, updateProfile };
