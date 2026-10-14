-- Not in the API spec: the schema was seeded before the Self-row rule existed, so this
-- backfills a relationship='Self' row for every existing user that doesn't already have one.

INSERT INTO family_members (user_id, name, date_of_birth, relationship, mobile, living_together)
SELECT u.id, u.name, u.date_of_birth, 'Self', u.mobile, 'NA'
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.user_id = u.id AND fm.relationship = 'Self'
);
