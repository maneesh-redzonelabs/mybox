const { query } = require('../../config/db');

async function getSummary(req, res, next) {
  try {
    const userId = req.userId;
    const [familyRes, policiesRes, vehiclesRes] = await Promise.all([
      query(`SELECT COUNT(*)::int AS count FROM family_members WHERE user_id = $1`, [userId]),
      query(`SELECT COUNT(*)::int AS count FROM policies WHERE user_id = $1`, [userId]),
      query(`SELECT COUNT(*)::int AS count FROM vehicles WHERE user_id = $1`, [userId]),
    ]);

    res.status(200).json({
      data: {
        familyMembers: familyRes.rows[0].count,
        policies: policiesRes.rows[0].count,
        vehicles: vehiclesRes.rows[0].count,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary };
