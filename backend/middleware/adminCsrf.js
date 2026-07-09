function verifyAdminCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const cookieToken = req.cookies?.adminCsrfToken;
  const headerToken = req.headers['x-admin-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: 'Jeton de sécurité invalide.' });
  }
  next();
}

module.exports = verifyAdminCsrf;
