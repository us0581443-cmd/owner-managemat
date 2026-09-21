const crypto = require('crypto');
const { run, get, query } = require('../../database/db');

/**
 * Hash a password using PBKDF2 with salt
 */
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

/**
 * Verify provided password against stored hash & salt
 */
function verifyPassword(password, storedHash, salt) {
  const hash = hashPassword(password, salt);
  return hash === storedHash;
}

/**
 * Generate secure session token and save in auth_tokens
 */
function createSessionToken(ownerId) {
  const token = crypto.randomBytes(32).toString('hex');
  // Expires in 30 days
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  run(
    'INSERT INTO auth_tokens (token, owner_id, expires_at) VALUES (?, ?, ?)',
    [token, ownerId, expiresAt]
  );
  return token;
}

/**
 * Generate 6-digit numeric OTP code
 */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Remove session token (logout)
 */
function revokeToken(token) {
  if (!token) return;
  run('DELETE FROM auth_tokens WHERE token = ?', [token]);
}

/**
 * Find owner by valid session token
 */
function getOwnerByToken(token) {
  if (!token) return null;
  const row = get(`
    SELECT o.id, o.name, o.email, o.phone, o.address, o.profile_image, o.is_verified, o.created_at, t.expires_at
    FROM auth_tokens t
    JOIN owners o ON t.owner_id = o.id
    WHERE t.token = ?
  `, [token]);

  if (!row) return null;

  // Check expiration
  if (new Date(row.expires_at) < new Date()) {
    revokeToken(token);
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    profile_image: row.profile_image,
    is_verified: row.is_verified,
    created_at: row.created_at
  };
}

module.exports = {
  hashPassword,
  verifyPassword,
  createSessionToken,
  generateOtp,
  revokeToken,
  getOwnerByToken
};
