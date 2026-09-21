const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { get, run } = require('../../database/db');
const {
  hashPassword,
  verifyPassword,
  createSessionToken,
  generateOtp,
  revokeToken
} = require('../utils/auth');
const { requireAuth } = require('../middleware/auth');
const { sendOtpEmail } = require('../services/emailService');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const owner = get('SELECT * FROM owners WHERE LOWER(email) = ?', [cleanEmail]);

    if (!owner) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isValid = verifyPassword(password, owner.password_hash, owner.salt);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    if (!owner.is_verified) {
      // Re-generate fresh OTP
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      run('UPDATE owners SET otp_code = ?, otp_expires_at = ? WHERE id = ?', [otp, expiresAt, owner.id]);

      // Send to Gmail
      const mailResult = await sendOtpEmail(cleanEmail, owner.name, otp);

      return res.status(403).json({
        success: false,
        needs_verification: true,
        email: cleanEmail,
        demo_otp: mailResult.sent ? null : otp,
        email_sent: mailResult.sent,
        error: mailResult.sent
          ? `Please enter the 6-digit OTP sent to your Gmail (${cleanEmail}).`
          : 'Please verify your OTP code to activate your account.'
      });
    }

    const token = createSessionToken(owner.id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      owner: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        address: owner.address,
        profile_image: owner.profile_image,
        is_verified: owner.is_verified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = get('SELECT id, is_verified FROM owners WHERE LOWER(email) = ?', [cleanEmail]);

    if (existing && existing.is_verified) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists. Please log in.'
      });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(password, salt);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    if (existing && !existing.is_verified) {
      // Update existing unverified owner
      run(
        `UPDATE owners 
         SET name = ?, phone = ?, password_hash = ?, salt = ?, otp_code = ?, otp_expires_at = ? 
         WHERE id = ?`,
        [name.trim(), phone?.trim() || null, hash, salt, otp, expiresAt, existing.id]
      );
    } else {
      // Insert new unverified owner
      run(
        `INSERT INTO owners (name, email, phone, password_hash, salt, is_verified, otp_code, otp_expires_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
        [name.trim(), cleanEmail, phone?.trim() || null, hash, salt, otp, expiresAt]
      );
    }

    // Send real email to recipient's Gmail inbox
    const mailResult = await sendOtpEmail(cleanEmail, name.trim(), otp);

    res.json({
      success: true,
      message: mailResult.sent
        ? `A 6-digit OTP verification code has been sent directly to ${cleanEmail}. Please check your inbox or spam.`
        : `OTP generated for ${cleanEmail}. Enter the code below to complete verification.`,
      email: cleanEmail,
      email_sent: mailResult.sent,
      demo_otp: mailResult.sent ? null : otp
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP code are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    const owner = get('SELECT * FROM owners WHERE LOWER(email) = ?', [cleanEmail]);
    if (!owner) {
      return res.status(404).json({ success: false, error: 'Account not found with this email' });
    }

    if (owner.otp_code !== cleanOtp) {
      return res.status(400).json({ success: false, error: 'Invalid OTP code. Please check your Gmail and try again.' });
    }

    if (owner.otp_expires_at && new Date(owner.otp_expires_at) < new Date()) {
      return res.status(400).json({ success: false, error: 'OTP code has expired. Please click Resend OTP.' });
    }

    // Activate account
    run('UPDATE owners SET is_verified = 1, otp_code = NULL, otp_expires_at = NULL WHERE id = ?', [owner.id]);

    const token = createSessionToken(owner.id);

    console.log(`✅ Owner verified & logged in: ${owner.name} (${cleanEmail})`);

    res.json({
      success: true,
      message: 'Account successfully verified! Welcome to your fresh workspace.',
      token,
      owner: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        is_verified: 1
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const owner = get('SELECT * FROM owners WHERE LOWER(email) = ?', [cleanEmail]);

    if (!owner) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    run('UPDATE owners SET otp_code = ?, otp_expires_at = ? WHERE id = ?', [otp, expiresAt, owner.id]);

    // Send real email to recipient's Gmail inbox
    const mailResult = await sendOtpEmail(cleanEmail, owner.name, otp);

    res.json({
      success: true,
      message: mailResult.sent
        ? `A fresh 6-digit OTP code has been dispatched to ${cleanEmail}.`
        : 'A fresh 6-digit OTP code has been issued.',
      email_sent: mailResult.sent,
      demo_otp: mailResult.sent ? null : otp
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    owner: req.owner
  });
});

// PUT /api/auth/profile - Update owner profile (name, phone, address, profile_image)
router.put('/profile', requireAuth, (req, res) => {
  try {
    const ownerId = req.ownerId;
    const { name, phone, address, profile_image } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Full name cannot be empty.' });
    }

    const current = req.owner;
    const newName = name.trim();
    const newPhone = phone !== undefined ? (phone ? phone.trim() : null) : current.phone;
    const newAddress = address !== undefined ? (address ? address.trim() : null) : current.address;
    const newImage = profile_image !== undefined ? (profile_image ? profile_image.trim() : null) : current.profile_image;

    run(`
      UPDATE owners
      SET name = ?,
          phone = ?,
          address = ?,
          profile_image = ?
      WHERE id = ?
    `, [newName, newPhone, newAddress, newImage, ownerId]);

    const updatedOwner = get(`
      SELECT id, name, email, phone, address, profile_image, is_verified, created_at
      FROM owners
      WHERE id = ?
    `, [ownerId]);

    console.log(`✅ Owner profile updated for ID ${ownerId}: ${newName}`);

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      owner: updatedOwner
    });
  } catch (error) {
    console.error('Error updating owner profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  try {
    let token = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (token) {
      revokeToken(token);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
