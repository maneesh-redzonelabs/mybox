/**
 * Jest globalSetup: truncates the MyBox_test schema's tables and re-applies seed.sql,
 * so `npm test` is repeatable (each run starts from the same known seeded state)
 * instead of accumulating mutations from previous test runs.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

module.exports = async function resetTestSchema() {
  const schema = process.env.DB_SCHEMA_TEST || 'MyBox_test';
  const client = new Client({
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'postgres',
  });

  await client.connect();
  try {
    await client.query(`SET search_path TO "${schema}", public`);
    await client.query(
      `TRUNCATE TABLE otp_requests, vehicles, policies, family_members, users RESTART IDENTITY CASCADE`
    );

    const seedPath = path.join(__dirname, '..', 'seed', 'seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await client.query(seedSql);
  } finally {
    await client.end();
  }
};
