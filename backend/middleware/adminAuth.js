const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.adminToken;
    if (!token) return res.status(401).json({ message: 'Accès refusé.' });

    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    if (payload.role !== 'admin') return res.status(401).json({ message: 'Accès refusé.' });

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Session administrateur expirée.' });
  }
}

module.exports = requireAdmin;
