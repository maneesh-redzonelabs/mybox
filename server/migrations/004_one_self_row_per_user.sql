-- API spec §11 gap #3: DB-level guarantee of exactly one "Self" row per user.

CREATE UNIQUE INDEX IF NOT EXISTS uq_family_members_one_self_per_user
    ON family_members(user_id) WHERE relationship = 'Self';
