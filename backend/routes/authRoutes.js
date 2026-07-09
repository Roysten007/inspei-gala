const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');
const requireAuth = require('../middleware/auth');
const verifyCsrf = require('../middleware/csrf');
const { signUserToken, generateCsrfToken } = require('../utils/tokens');
const { authCookieOptions, csrfCookieOptions } = require('../utils/cookies');

const router = express.Router();

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Slows down brute-force / credential stuffing regardless of app-level lockout.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives. Réessayez dans quelques minutes.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de comptes créés depuis cette adresse. Réessayez plus tard.' },
});

function issueSession(res, userId) {
  const token = signUserToken(userId);
  const csrfToken = generateCsrfToken();
  res.cookie('token', token, authCookieOptions(SEVEN_DAYS_MS));
  res.cookie('csrfToken', csrfToken, csrfCookieOptions(SEVEN_DAYS_MS));
}

// ---------- POST /api/auth/register ----------
router.post(
  '/register',
  registerLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Nom invalide.'),
    body('email').trim().isEmail().withMessage('Email invalide.').normalizeEmail(),
    body('phone').trim().isLength({ min: 8, max: 30 }).withMessage('Numéro de téléphone invalide.'),
    body('password')
      .isLength({ min: 8 }).withMessage('8 caractères minimum.')
      .matches(/\d/).withMessage('Le mot de passe doit contenir au moins un chiffre.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { name, email, phone, password } = req.body;
      const existing = await User.findByEmail(email);
      if (existing) {
        return res.status(409).json({ message: 'Un compte existe déjà avec cet email.' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.createUser({ name, email, phone, passwordHash });

      issueSession(res, user.id);
      res.status(201).json({ user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
      next(err);
    }
  }
);

// ---------- POST /api/auth/login ----------
router.post(
  '/login',
  loginLimiter,
  [
    body('email').trim().isEmail().withMessage('Email invalide.').normalizeEmail(),
    body('password').notEmpty().withMessage('Mot de passe requis.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { email, password } = req.body;
      // Generic error message on every failure path below — never reveal
      // whether the email exists, to avoid account enumeration.
      const genericError = { message: 'Email ou mot de passe incorrect.' };

      const user = await User.findByEmail(email);
      if (!user) return res.status(401).json(genericError);

      if (User.isLocked(user)) {
        return res.status(423).json({ message: 'Compte temporairement verrouillé après plusieurs échecs. Réessayez plus tard.' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        const nextAttempts = user.failed_login_attempts + 1;
        const locked = nextAttempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_DURATION_MS) : null;
        await User.recordFailedLogin(user.id, {
          locked,
          failedAttempts: locked ? 0 : nextAttempts,
        });
        return res.status(401).json(genericError);
      }

      await User.resetLoginAttempts(user.id);

      issueSession(res, user.id);
      res.json({ user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
      next(err);
    }
  }
);

// ---------- POST /api/auth/logout ----------
router.post('/logout', verifyCsrf, (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.clearCookie('csrfToken', { path: '/' });
  res.json({ message: 'Déconnecté.' });
});

// ---------- GET /api/auth/me ----------
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email } });
});

module.exports = router;
