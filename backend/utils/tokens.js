const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function signUserToken(userId) {
  return jwt.sign({ sub: userId, role: 'user' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function signAdminToken() {
  return jwt.sign({ role: 'admin' }, process.env.ADMIN_JWT_SECRET, {
    expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '12h',
  });
}

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { signUserToken, signAdminToken, generateCsrfToken };
