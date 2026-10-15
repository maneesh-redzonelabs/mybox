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
const { encryptField, hashForLookup, isEncrypted } = require('../src/lib/crypto');

function getSchemaArg() {
  const arg = process.argv.find((a) => a.startsWith('--schema='));
  if (arg) return arg.split('=')[1];
  return process.env.DB_SCHEMA || 'MyBox';
}

/**
 * Idempotent backfill: encrypts any value in the four sensitive columns that isn't already
 * "enc:v1:"-prefixed (covers genuinely pre-existing plaintext data AND the plaintext INSERTs
 * that seed/seed.sql keeps running on every migrate), and (re)computes the deterministic
 * lookup-hash columns for policy_no / registration_no. Rows already encrypted are skipped,
 * so this is safe to run on every `node scripts/migrate.js` invocation.
 */
async function backfillEncryption(client, schema) {
  if (!process.env.ENCRYPTION_KEY || !process.env.HMAC_KEY) {
    console.log('[migrate] skipping encryption backfill: ENCRYPTION_KEY/HMAC_KEY not set');
    return;
  }

  console.log('[migrate] running encryption backfill...');
  await client.query(`SET search_path TO "${schema}", public`);

  // family_members.mobile — encrypt only, no hash/uniqueness.
  {
    const { rows } = await client.query(`SELECT id, mobile FROM family_members WHERE mobile IS NOT NULL`);
    let count = 0;
    for (const row of rows) {
      if (isEncrypted(row.mobile)) continue;
      await client.query(`UPDATE family_members SET mobile = $1 WHERE id = $2`, [encryptField(row.mobile), row.id]);
      count++;
    }
    console.log(`[migrate] backfill: encrypted ${count} family_members.mobile value(s)`);
  }

  // policies.policy_no — encrypt + lookup hash.
  {
    const { rows } = await client.query(`SELECT id, policy_no FROM policies`);
    let count = 0;
    for (const row of rows) {
      if (isEncrypted(row.policy_no)) continue;
      await client.query(
        `UPDATE policies SET policy_no = $1, policy_no_hash = $2 WHERE id = $3`,
        [encryptField(row.policy_no), hashForLookup(row.policy_no), row.id]
      );
      count++;
    }
    console.log(`[migrate] backfill: encrypted ${count} policies.policy_no value(s)`);
  }

  // vehicles.registration_no (+ hash) and vehicles.insurance_policy (encrypt only).
  {
    const { rows } = await client.query(`SELECT id, registration_no, insurance_policy FROM vehicles`);
    let regCount = 0;
    let insCount = 0;
    for (const row of rows) {
      if (!isEncrypted(row.registration_no)) {
        await client.query(
          `UPDATE vehicles SET registration_no = $1, registration_no_hash = $2 WHERE id = $3`,
          [encryptField(row.registration_no), hashForLookup(row.registration_no), row.id]
        );
        regCount++;
      }
      if (row.insurance_policy !== null && !isEncrypted(row.insurance_policy)) {
        await client.query(`UPDATE vehicles SET insurance_policy = $1 WHERE id = $2`, [
          encryptField(row.insurance_policy),
          row.id,
        ]);
        insCount++;
      }
    }
    console.log(`[migrate] backfill: encrypted ${regCount} vehicles.registration_no, ${insCount} vehicles.insurance_policy value(s)`);
  }
}

/**
 * Must run BEFORE seed/seed.sql on every invocation. seed.sql's ON CONFLICT (...hash) DO NOTHING
 * idempotency check only works if pre-existing rows already have their lookup-hash column
 * populated -- otherwise NULL <> NULL means an existing plaintext row is never recognized as a
 * match for the same plaintext value seed.sql is about to (re)insert, and a duplicate gets
 * created. This fills in just the hash (not the encryption) for any not-yet-encrypted row whose
 * hash is still NULL, which is exactly the set of rows seed.sql's ON CONFLICT needs to compare
 * against correctly. The full encrypt+hash backfill still runs after seed.sql as usual.
 */
async function syncLookupHashesBeforeSeed(client, schema) {
  if (!process.env.HMAC_KEY) return;
  await client.query(`SET search_path TO "${schema}", public`);

  const { rows: policyRows } = await client.query(
    `SELECT id, policy_no FROM policies WHERE policy_no_hash IS NULL`
  );
  for (const row of policyRows) {
    if (isEncrypted(row.policy_no)) continue;
    await client.query(`UPDATE policies SET policy_no_hash = $1 WHERE id = $2`, [hashForLookup(row.policy_no), row.id]);
  }

  const { rows: vehicleRows } = await client.query(
    `SELECT id, registration_no FROM vehicles WHERE registration_no_hash IS NULL`
  );
  for (const row of vehicleRows) {
    if (isEncrypted(row.registration_no)) continue;
    await client.query(`UPDATE vehicles SET registration_no_hash = $1 WHERE id = $2`, [hashForLookup(row.registration_no), row.id]);
  }
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

    // seed.sql computes policy_no_hash/registration_no_hash in SQL (via pgcrypto's hmac()) using
    // the same HMAC_KEY as src/lib/crypto.js's hashForLookup(), so expose it as a session GUC first.
    if (process.env.HMAC_KEY) {
      await client.query(`SELECT set_config('app.hmac_key_b64', $1, false)`, [process.env.HMAC_KEY]);
    }

    await syncLookupHashesBeforeSeed(client, schema);

    const seedPath = path.join(__dirname, '..', 'seed', 'seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('[migrate] applying seed/seed.sql (idempotent)');
      await client.query(`SET search_path TO "${schema}", public`);
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await client.query(seedSql);
    }

    await backfillEncryption(client, schema);

    console.log('[migrate] done.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[migrate] FAILED:', err);
  process.exit(1);
});
