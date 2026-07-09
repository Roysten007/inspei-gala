const isProd = process.env.NODE_ENV === 'production';

// httpOnly session cookies: unreachable from JavaScript, mitigates XSS token theft.
const authCookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: isProd,           // requires HTTPS in production
  sameSite: 'lax',          // sent on top-level navigation, blocks most CSRF vectors already
  maxAge: maxAgeMs,
  path: '/',
});

// CSRF cookie must be readable by JS (double-submit pattern), so httpOnly: false.
const csrfCookieOptions = (maxAgeMs) => ({
  httpOnly: false,
  secure: isProd,
  sameSite: 'lax',
  maxAge: maxAgeMs,
  path: '/',
});

module.exports = { authCookieOptions, csrfCookieOptions };
