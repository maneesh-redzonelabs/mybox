-- =========================================================
-- MyBox Portal - PostgreSQL database build script
-- Generated from MyBox.html / MyBox-database-schema.html
--
-- Run as a single script against an empty database, e.g.:
--   psql -U <user> -d <database> -f MyBox-database.sql
-- =========================================================

BEGIN;

-- =========================================================
-- 1. Schema objects
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL PRIMARY KEY,
    mobile          VARCHAR(10) NOT NULL UNIQUE
                        CHECK (mobile ~ '^[0-9]{10}$'),
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL
                        CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    date_of_birth   DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS family_members (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL
                         REFERENCES users(id) ON DELETE CASCADE,
    name             VARCHAR(150) NOT NULL,
    date_of_birth    DATE,
    relationship     VARCHAR(30) NOT NULL
                         CHECK (relationship IN (
                             'Self', 'Spouse', 'Son', 'Daughter', 'Father',
                             'Mother', 'Brother', 'Sister', 'Doughter-in-law',
                             'Son-in-law', 'Uncle', 'Aunt',
                             'Cousin Sister', 'Cousin Brother'
                         )),
    mobile           VARCHAR(10)
                         CHECK (mobile IS NULL OR mobile ~ '^[0-9]{10}$'),
    living_together  VARCHAR(3) NOT NULL
                         CHECK (living_together IN ('Yes', 'No')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);

CREATE TABLE IF NOT EXISTS policies (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL
                            REFERENCES users(id) ON DELETE CASCADE,
    policy_no           VARCHAR(50) NOT NULL,
    bank_name           VARCHAR(150) NOT NULL,
    policy_type         VARCHAR(20) NOT NULL
                            CHECK (policy_type IN ('Life Insurance', 'Health Insurance')),
    start_date          DATE NOT NULL,
    policy_term_years   SMALLINT NOT NULL CHECK (policy_term_years BETWEEN 1 AND 60),
    paying_term_years   SMALLINT NOT NULL CHECK (paying_term_years BETWEEN 1 AND 60),
    emi_frequency       VARCHAR(20) NOT NULL
                            CHECK (emi_frequency IN (
                                'Monthly', 'Quaterly', 'Half Yearly',
                                'Yearly', 'Single Premium'
                            )),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, policy_no)
);

CREATE INDEX IF NOT EXISTS idx_policies_user_id ON policies(user_id);

CREATE TABLE IF NOT EXISTS vehicles (
    id                 BIGSERIAL PRIMARY KEY,
    user_id            BIGINT NOT NULL
                           REFERENCES users(id) ON DELETE CASCADE,
    registration_no    VARCHAR(15) NOT NULL UNIQUE
                           CHECK (registration_no ~ '^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$'),
    vehicle_type       VARCHAR(10) NOT NULL
                           CHECK (vehicle_type IN ('Car', 'Bike', 'Scooty')),
    make               VARCHAR(100) NOT NULL,
    model_year         SMALLINT NOT NULL
                           CHECK (model_year BETWEEN 1990 AND 2100),
    insurance_policy   VARCHAR(100),
    pollution_upto     DATE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);

-- =========================================================
-- 2. Keep updated_at current on every UPDATE
-- =========================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_family_members_updated_at ON family_members;
CREATE TRIGGER trg_family_members_updated_at
    BEFORE UPDATE ON family_members
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_policies_updated_at ON policies;
CREATE TRIGGER trg_policies_updated_at
    BEFORE UPDATE ON policies
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_vehicles_updated_at ON vehicles;
CREATE TRIGGER trg_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- 3. Views for the app's computed/display fields
-- =========================================================
CREATE OR REPLACE VIEW v_family_members AS
SELECT fm.*,
       DATE_PART('year', AGE(fm.date_of_birth)) AS age
FROM family_members fm;

CREATE OR REPLACE VIEW v_policies AS
SELECT p.*,
       (p.start_date + (p.policy_term_years || ' years')::interval)::date AS maturity_date
FROM policies p;

-- =========================================================
-- 4. Seed data
--    Mirrors the mock user seeded in MyBox.html (mobile 9999999999)
-- =========================================================

INSERT INTO users (mobile, name, email, date_of_birth)
VALUES ('9999999999', 'Maneesh Sharma', 'maneesh.sharma@redzonelabs.in', DATE '1985-05-10')
ON CONFLICT (mobile) DO NOTHING;

-- ---- Family members ----
INSERT INTO family_members (user_id, name, date_of_birth, relationship, mobile, living_together)
SELECT u.id, m.name, m.date_of_birth, m.relationship, NULLIF(m.mobile, ''), m.living_together
FROM users u
CROSS JOIN (
    VALUES
        ('Priya Sharma',  DATE '1988-03-15', 'Spouse', '9876543210', 'Yes'),
        ('Aarav Sharma',  DATE '2014-09-20', 'Son',    '',           'Yes'),
        ('Ramesh Sharma', DATE '1958-01-05', 'Father', '9123456780', 'No'),
        ('Sunita Sharma', DATE '1962-06-25', 'Mother', '9123456781', 'No')
) AS m(name, date_of_birth, relationship, mobile, living_together)
WHERE u.mobile = '9999999999'
ON CONFLICT DO NOTHING;

-- ---- Policies ----
INSERT INTO policies (user_id, policy_no, bank_name, policy_type, start_date, policy_term_years, paying_term_years, emi_frequency)
SELECT u.id, p.policy_no, p.bank_name, p.policy_type, p.start_date, p.policy_term_years, p.paying_term_years, p.emi_frequency
FROM users u
CROSS JOIN (
    VALUES
        ('LIC-2015-00123',  'LIC of India', 'Life Insurance',   DATE '2015-04-01', 20, 15, 'Yearly'),
        ('HDFC-2019-00987', 'HDFC Life',    'Health Insurance', DATE '2019-07-15', 10, 10, 'Monthly'),
        ('SBI-2021-00456',  'SBI Life',     'Life Insurance',   DATE '2021-01-10', 25, 20, 'Single Premium')
) AS p(policy_no, bank_name, policy_type, start_date, policy_term_years, paying_term_years, emi_frequency)
WHERE u.mobile = '9999999999'
ON CONFLICT (user_id, policy_no) DO NOTHING;

-- ---- Vehicles ----
INSERT INTO vehicles (user_id, registration_no, vehicle_type, make, model_year, insurance_policy, pollution_upto)
SELECT u.id, v.registration_no, v.vehicle_type, v.make, v.model_year, v.insurance_policy, v.pollution_upto
FROM users u
CROSS JOIN (
    VALUES
        ('MH12AB1234', 'Car',  'Maruti Suzuki',                             2019, 'HDFC-ERGO-MV-2024-7781',   DATE '2026-12-05'),
        ('MH14CD5678', 'Bike', 'Honda Motorcycle & Scooter India (HMSI)',   2021, 'ICICI-LOMBARD-MV-2024-3321', DATE '2026-11-18')
) AS v(registration_no, vehicle_type, make, model_year, insurance_policy, pollution_upto)
WHERE u.mobile = '9999999999'
ON CONFLICT (registration_no) DO NOTHING;

COMMIT;
