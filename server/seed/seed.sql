-- Idempotent seed data (ON CONFLICT DO NOTHING), mirrors MyBox-database.sql §4.
-- The Self family-member row is also seeded here (idempotently) so that a brand-new
-- schema (e.g. MyBox_test, created and migrated from scratch in the same run) ends up
-- with the Self row too -- migrations/005_backfill_self_rows.sql additionally covers the
-- case where migrations are applied against an already-seeded, pre-existing schema
-- (the real "MyBox" schema in this project) where users existed before 005 ran.

INSERT INTO users (mobile, name, email, date_of_birth)
VALUES ('9999999999', 'Maneesh Sharma', 'maneesh.sharma@redzonelabs.in', DATE '1985-05-10')
ON CONFLICT (mobile) DO NOTHING;

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
AND NOT EXISTS (
    SELECT 1 FROM family_members fm WHERE fm.user_id = u.id AND fm.name = m.name AND fm.relationship = m.relationship
);

-- Self row for the seeded user (idempotent) -- see note above.
INSERT INTO family_members (user_id, name, date_of_birth, relationship, mobile, living_together)
SELECT u.id, u.name, u.date_of_birth, 'Self', u.mobile, 'NA'
FROM users u
WHERE u.mobile = '9999999999'
AND NOT EXISTS (
    SELECT 1 FROM family_members fm WHERE fm.user_id = u.id AND fm.relationship = 'Self'
);

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
