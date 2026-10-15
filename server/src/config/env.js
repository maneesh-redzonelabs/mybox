require('dotenv').config();

const isTest = process.env.NODE_ENV === 'test';

module.exports = {
  port: Number(process.env.PORT || 4000),
  isTest,
  db: {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'postgres',
    schema: isTest
      ? (process.env.DB_SCHEMA_TEST || 'MyBox_test')
      : (process.env.DB_SCHEMA || 'MyBox'),
  },
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || '',
    hmacKey: process.env.HMAC_KEY || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  },
  otp: {
    code: process.env.OTP_CODE || '123456',
    ttlSeconds: Number(process.env.OTP_TTL_SECONDS || 300),
    rateLimitWindowSeconds: Number(process.env.OTP_RATE_LIMIT_WINDOW_SECONDS || 60),
    rateLimitMax: Number(process.env.OTP_RATE_LIMIT_MAX || 5),
  },
};
