const jwt = require('jsonwebtoken');

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

module.exports = { signUserToken, signAdminToken };
