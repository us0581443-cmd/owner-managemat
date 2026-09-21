const { getOwnerByToken } = require('../utils/auth');
const { get } = require('../../database/db');

function requireAuth(req, res, next) {
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (token) {
    const owner = getOwnerByToken(token);
    if (owner) {
      req.owner = owner;
      req.ownerId = owner.id;
      return next();
    }
  }

  // Check direct header (for development & testing)
  const headerOwnerId = req.headers['x-owner-id'];
  if (headerOwnerId) {
    const owner = get('SELECT id, name, email, phone, address, profile_image, is_verified, created_at FROM owners WHERE id = ?', [Number(headerOwnerId)]);
    if (owner) {
      req.owner = owner;
      req.ownerId = owner.id;
      return next();
    }
  }

  // Require explicit authentication - no unauthenticated access
  return res.status(401).json({ success: false, error: 'Unauthorized. Please log in with your email and password.' });
}

module.exports = { requireAuth };
