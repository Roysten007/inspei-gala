const jwt = require('jsonwebtoken');
const User = require('../models/User');

function extractToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ message: 'Veuillez vous connecter.' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'Session invalide, reconnectez-vous.' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Session expirée, reconnectez-vous.' });
  }
}

module.exports = requireAuth;
