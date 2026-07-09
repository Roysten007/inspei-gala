const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.token;
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
