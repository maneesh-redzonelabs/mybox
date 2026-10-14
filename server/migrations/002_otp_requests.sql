-- API spec §11 gap #1: OTP storage table (additive; does not touch existing tables).

CREATE TABLE IF NOT EXISTS otp_requests (
    id          BIGSERIAL PRIMARY KEY,
    mobile      VARCHAR(10) NOT NULL,
    otp_hash    TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    attempts    SMALLINT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_requests_mobile ON otp_requests(mobile);
