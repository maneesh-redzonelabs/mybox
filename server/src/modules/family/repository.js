const { query, withTransaction } = require('../../config/db');
const { encryptField, decryptField } = require('../../lib/crypto');

function mapRow(row) {
  return {
    id: Number(row.id),
    name: row.name,
    dateOfBirth: row.date_of_birth || null,
    age: row.age === null || row.age === undefined ? null : Number(row.age),
    relationship: row.relationship,
    mobile: decryptField(row.mobile) || '',
    livingTogether: row.living_together,
    isSelf: row.relationship === 'Self',
  };
}

async function list(userId) {
  const { rows } = await query(
    `SELECT * FROM v_family_members
     WHERE user_id = $1
     ORDER BY (relationship = 'Self') DESC, id ASC`,
    [userId]
  );
  return rows.map(mapRow);
}

async function findUser(client, userId) {
  const { rows } = await client.query(`SELECT * FROM users WHERE id = $1`, [userId]);
  return rows[0] || null;
}

/**
 * Replaces the user's non-Self family members with `members` in one transaction:
 * delete-not-present, upsert-present. The Self row is never accepted from the client;
 * it is re-derived from the profile on every call.
 */
async function bulkReplace(userId, members) {
  return withTransaction(async (client) => {
    const user = await findUser(client, userId);

    const keepIds = members.filter((m) => m.id != null).map((m) => Number(m.id));

    if (keepIds.length > 0) {
      await client.query(
        `DELETE FROM family_members
         WHERE user_id = $1 AND relationship <> 'Self' AND id <> ALL($2::bigint[])`,
        [userId, keepIds]
      );
    } else {
      await client.query(
        `DELETE FROM family_members WHERE user_id = $1 AND relationship <> 'Self'`,
        [userId]
      );
    }

    for (const m of members) {
      if (m.id != null) {
        await client.query(
          `UPDATE family_members
           SET name = $1, date_of_birth = $2, relationship = $3, mobile = $4, living_together = $5
           WHERE id = $6 AND user_id = $7 AND relationship <> 'Self'`,
          [m.name, m.dateOfBirth || null, m.relationship, encryptField(m.mobile || null), m.livingTogether, m.id, userId]
        );
      } else {
        await client.query(
          `INSERT INTO family_members (user_id, name, date_of_birth, relationship, mobile, living_together)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, m.name, m.dateOfBirth || null, m.relationship, encryptField(m.mobile || null), m.livingTogether]
        );
      }
    }

    // Re-derive/ensure the Self row from the authoritative profile (never trust client input for it).
    const { rows: selfRows } = await client.query(
      `SELECT id FROM family_members WHERE user_id = $1 AND relationship = 'Self'`,
      [userId]
    );
    if (selfRows.length > 0) {
      await client.query(
        `UPDATE family_members
         SET name = $1, date_of_birth = $2, mobile = $3, living_together = 'NA'
         WHERE user_id = $4 AND relationship = 'Self'`,
        [user.name, user.date_of_birth, encryptField(user.mobile), userId]
      );
    } else {
      await client.query(
        `INSERT INTO family_members (user_id, name, date_of_birth, relationship, mobile, living_together)
         VALUES ($1, $2, $3, 'Self', $4, 'NA')`,
        [userId, user.name, user.date_of_birth, encryptField(user.mobile)]
      );
    }

    const { rows } = await client.query(
      `SELECT * FROM v_family_members
       WHERE user_id = $1
       ORDER BY (relationship = 'Self') DESC, id ASC`,
      [userId]
    );
    return rows.map(mapRow);
  });
}

module.exports = { list, bulkReplace };
