-- Application-level field encryption (AES-256-GCM, see src/lib/crypto.js) for:
--   family_members.mobile, policies.policy_no, vehicles.registration_no, vehicles.insurance_policy
--
-- These columns now store "enc:v1:<iv>:<authTag>:<ciphertext>" strings instead of plaintext,
-- so they're widened to TEXT and their plaintext-format CHECK constraints are dropped (format
-- validation already happens in src/lib/validators.js before encryption).
--
-- AES-GCM ciphertext is non-deterministic (random IV per call), so it can't satisfy the
-- existing UNIQUE constraints on policy_no / registration_no. Those move onto new deterministic
-- HMAC-SHA256 lookup-hash columns (policy_no_hash, registration_no_hash) instead.
--
-- pgcrypto is needed so seed/seed.sql (which keeps inserting plaintext policy_no/registration_no
-- values, idempotently de-duplicated via ON CONFLICT on the hash columns) can compute the same
-- HMAC-SHA256 lookup hash in SQL that src/lib/crypto.js's hashForLookup() computes in Node.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- v_family_members / v_policies (SELECT fm.* / p.*) block ALTER COLUMN TYPE on the underlying
-- tables; drop them first and recreate (same definitions as migrations/001_init.sql) at the end.
DROP VIEW IF EXISTS v_family_members;
DROP VIEW IF EXISTS v_policies;

-- family_members.mobile: widen + drop format CHECK (no uniqueness requirement, no hash needed).
ALTER TABLE family_members ALTER COLUMN mobile TYPE TEXT;
ALTER TABLE family_members DROP CONSTRAINT IF EXISTS family_members_mobile_check;

-- policies.policy_no: widen, add hash column, move UNIQUE (user_id, policy_no) onto the hash.
ALTER TABLE policies ALTER COLUMN policy_no TYPE TEXT;
ALTER TABLE policies ADD COLUMN IF NOT EXISTS policy_no_hash TEXT;
ALTER TABLE policies DROP CONSTRAINT IF EXISTS policies_user_id_policy_no_key;
ALTER TABLE policies ADD CONSTRAINT policies_user_id_policy_no_hash_key UNIQUE (user_id, policy_no_hash);

-- vehicles.registration_no: widen, drop format CHECK, add hash column,
-- move UNIQUE (registration_no) onto the hash.
ALTER TABLE vehicles ALTER COLUMN registration_no TYPE TEXT;
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_registration_no_check;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS registration_no_hash TEXT;
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_registration_no_key;
ALTER TABLE vehicles ADD CONSTRAINT vehicles_registration_no_hash_key UNIQUE (registration_no_hash);

-- vehicles.insurance_policy: widen only (encrypted, no uniqueness).
ALTER TABLE vehicles ALTER COLUMN insurance_policy TYPE TEXT;

-- Recreate the views dropped above (unchanged definitions from migrations/001_init.sql).
CREATE OR REPLACE VIEW v_family_members AS
SELECT fm.*,
       DATE_PART('year', AGE(fm.date_of_birth)) AS age
FROM family_members fm;

CREATE OR REPLACE VIEW v_policies AS
SELECT p.*,
       (p.start_date + (p.policy_term_years || ' years')::interval)::date AS maturity_date
FROM policies p;
