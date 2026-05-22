// AES-256-GCM symmetric encryption for OAuth tokens at rest.
//
// We store Google's access_token + refresh_token in Postgres. We never want
// them to be plaintext — a database leak shouldn't equal a Google takeover.
// This helper handles encrypt/decrypt with a single master key.
//
// MASTER KEY:
//   Env var INTEGRATIONS_ENCRYPTION_KEY = 32 random bytes, base64-encoded
//   Generate via: openssl rand -base64 32
//   Rotate by re-encrypting all rows under a new key (out of scope for v1).

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12        // GCM standard
const AUTH_TAG_LENGTH = 16  // GCM standard

function loadKey() {
  const b64 = process.env.INTEGRATIONS_ENCRYPTION_KEY
  if (!b64) {
    throw new Error(
      'INTEGRATIONS_ENCRYPTION_KEY env var is not set. ' +
      'Generate via `openssl rand -base64 32` and add to Vercel env vars.'
    )
  }
  const key = Buffer.from(b64, 'base64')
  if (key.length !== 32) {
    throw new Error(
      `INTEGRATIONS_ENCRYPTION_KEY must decode to 32 bytes (got ${key.length}). ` +
      'Regenerate with `openssl rand -base64 32`.'
    )
  }
  return key
}

/**
 * Encrypt a string with AES-256-GCM.
 * @param {string} plaintext
 * @returns {string} base64 of `iv:ciphertext:authTag` concatenated bytes
 */
export function encrypt(plaintext) {
  if (plaintext == null) return null
  const key = loadKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  // Layout: iv (12 bytes) || ciphertext (variable) || authTag (16 bytes)
  return Buffer.concat([iv, ciphertext, authTag]).toString('base64')
}

/**
 * Decrypt a string previously produced by encrypt().
 * @param {string} encoded base64
 * @returns {string} plaintext
 */
export function decrypt(encoded) {
  if (encoded == null) return null
  const key = loadKey()
  const buf = Buffer.from(String(encoded), 'base64')
  if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Ciphertext too short to be valid AES-GCM output')
  }
  const iv = buf.subarray(0, IV_LENGTH)
  const authTag = buf.subarray(buf.length - AUTH_TAG_LENGTH)
  const ciphertext = buf.subarray(IV_LENGTH, buf.length - AUTH_TAG_LENGTH)
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])
  return plaintext.toString('utf8')
}

/**
 * Round-trip self-test. Throws if encryption isn't working correctly.
 * Useful for a deploy-time sanity check.
 */
export function selfTest() {
  const sample = 'sample plaintext ' + Date.now()
  const ct = encrypt(sample)
  const pt = decrypt(ct)
  if (pt !== sample) {
    throw new Error('Encryption self-test failed — encrypt/decrypt mismatch')
  }
  return true
}
