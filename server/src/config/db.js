const { Pool, types } = require('pg');
const env = require('./env');

// Return DATE columns as plain 'YYYY-MM-DD' strings (not JS Date objects) to avoid
// timezone-shift bugs — the API wire format for dates is always ISO YYYY-MM-DD.
types.setTypeParser(1082, (val) => val);

const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
});

// Every connection in the pool must SET search_path to the (mixed-case, quoted) schema.
pool.on('connect', (client) => {
  client.query(`SET search_path TO "${env.db.schema}", public`);
});

async function query(text, params) {
  return pool.query(text, params);
}

async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
