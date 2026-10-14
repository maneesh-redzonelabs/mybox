-- Mirrors MyBox-database.sql's schema section (tables/indexes/triggers/views).

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

CREATE OR REPLACE VIEW v_family_members AS
SELECT fm.*,
       DATE_PART('year', AGE(fm.date_of_birth)) AS age
FROM family_members fm;

CREATE OR REPLACE VIEW v_policies AS
SELECT p.*,
       (p.start_date + (p.policy_term_years || ' years')::interval)::date AS maturity_date
FROM policies p;
