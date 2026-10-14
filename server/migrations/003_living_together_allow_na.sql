-- API spec §11 gap #2: living_together CHECK constraint must allow 'NA' (Self row).

ALTER TABLE family_members DROP CONSTRAINT IF EXISTS family_members_living_together_check;
ALTER TABLE family_members ADD CONSTRAINT family_members_living_together_check
    CHECK (living_together IN ('Yes', 'No', 'NA'));
