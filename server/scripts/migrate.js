#!/usr/bin/env node
/**
 * Applies migrations/*.sql in order against a given schema (idempotently tracked in
 * schema_migrations), creating the schema if it doesn't exist, then runs seed/seed.sql.
 *
 * Usage: node scripts/migrate.js --schema=MyBox
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function getSchemaArg() {
  const arg = process.argv.find((a) => a.startsWith('--schema='));
  if (arg) return arg.split('=')[1];
  return process.env.DB_SCHEMA || 'MyBox';
}

async function main() {
  const schema = getSchemaArg();
  const client = new Client({
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'postgres',
  });

  await client.connect();
  console.log(`[migrate] connected; target schema = "${schema}"`);

  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    await client.query(`SET search_path TO "${schema}", public`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename    TEXT PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const { rows: appliedRows } = await client.query('SELECT filename FROM schema_migrations');
    const applied = new Set(appliedRows.map((r) => r.filename));

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[migrate] skip (already applied): ${file}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`[migrate] applying: ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(`SET search_path TO "${schema}", public`);
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${err.message}`);
      }
    }

    const seedPath = path.join(__dirname, '..', 'seed', 'seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('[migrate] applying seed/seed.sql (idempotent)');
      await client.query(`SET search_path TO "${schema}", public`);
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await client.query(seedSql);
    }

    console.log('[migrate] done.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[migrate] FAILED:', err);
  process.exit(1);
});
