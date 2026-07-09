// Double-submit cookie CSRF check.
// The cookie is set on login; the client must echo it back in a header.
// A cross-site attacker's page cannot read our cookie, so it cannot forge the header.
function verifyCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: 'Jeton de sécurité invalide. Rechargez la page et réessayez.' });
  }
  next();
}

module.exports = verifyCsrf;
