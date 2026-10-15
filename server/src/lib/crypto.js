const crypto = require('crypto');
const env = require('../config/env');

// Application-level field encryption for sensitive columns (AES-256-GCM) plus a
// deterministic HMAC-SHA256 lookup hash for columns that need uniqueness checks
// without exposing a deterministic ciphertext (AES-GCM is intentionally non-deterministic).
//
// Ciphertext format: enc:v1:<base64 iv>:<base64 authTag>:<base64 ciphertext>
// The "enc:v1:" prefix lets decryptField() and the backfill script tell already-encrypted
// values apart from plaintext still awaiting encryption.

const ALGORITHM = 'aes-256-gcm';
const PREFIX = 'enc:v1:';
const IV_LENGTH = 12; // recommended IV length for GCM

function getEncryptionKey() {
  const b64 = env.security.encryptionKey;
  if (!b64) {
    throw new Error('ENCRYPTION_KEY is not configured.');
  }
  const key = Buffer.from(b64, 'base64');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must base64-decode to exactly 32 bytes.');
  }
  return key;
}

function getHmacKey() {
  const b64 = env.security.hmacKey;
  if (!b64) {
    throw new Error('HMAC_KEY is not configured.');
  }
  const key = Buffer.from(b64, 'base64');
  if (key.length === 0) {
    throw new Error('HMAC_KEY must base64-decode to a non-empty key.');
  }
  return key;
}

/**
 * Encrypts a plaintext value into the enc:v1:... string format.
 * Returns null/undefined unchanged so callers can pass optional fields straight through.
 */
function encryptField(plaintext) {
  if (plaintext === null || plaintext === undefined) return plaintext;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`;
}

/**
 * Decrypts a value previously produced by encryptField(). If the value doesn't start
 * with the enc:v1: prefix it is returned unchanged -- this keeps reads of not-yet-encrypted
 * (or already-plaintext) data safe during the migration/backfill transition window.
 */
function decryptField(value) {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'string' || !value.startsWith(PREFIX)) return value;

  const rest = value.slice(PREFIX.length);
  const parts = rest.split(':');
  if (parts.length !== 3) return value;

  const [ivB64, tagB64, dataB64] = parts;
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
    return plaintext.toString('utf8');
  } catch (err) {
    throw new Error(`Failed to decrypt field: ${err.message}`);
  }
}

/** Deterministic HMAC-SHA256 hex digest, used as a lookup/uniqueness key for ciphertext columns. */
function hashForLookup(plaintext) {
  if (plaintext === null || plaintext === undefined) return plaintext;
  const key = getHmacKey();
  return crypto.createHmac('sha256', key).update(String(plaintext), 'utf8').digest('hex');
}

function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

module.exports = { encryptField, decryptField, hashForLookup, isEncrypted, PREFIX };
