const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { body, validationResult } = require('express-validator');

const Submission = require('../models/Submission');
const requireAdmin = require('../middleware/adminAuth');
const { signAdminToken } = require('../utils/tokens');
const { UPLOAD_DIR } = require('../middleware/upload');

const router = express.Router();

// Deliberately strict: this endpoint guards the entire submissions database.
const adminLoginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives. Réessayez plus tard.' },
});

function toClientShape(row) {
  return {
    id: row.id,
    title: row.title,
    team: row.team,
    description: row.description,
    projectLink: row.project_link,
    fileStoredName: row.file_stored_name,
    fileOriginalName: row.file_original_name,
    status: row.status,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: {
      name: row.user_name,
      email: row.user_email,
      phone: row.user_phone,
    },
  };
}

// ---------- POST /login ----------
router.post(
  '/login',
  adminLoginLimiter,
  [body('password').notEmpty().withMessage('Mot de passe requis.')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

      const { password } = req.body;
      const match = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH || '');
      if (!match) {
        console.warn(`[ADMIN] Tentative de connexion échouée depuis ${req.ip} à ${new Date().toISOString()}`);
        return res.status(401).json({ message: 'Mot de passe incorrect.' });
      }

      const token = signAdminToken();
      res.json({ token });
    } catch (err) {
      next(err);
    }
  }
);

// ---------- POST /logout ----------
router.post('/logout', requireAdmin, (req, res) => {
  res.json({ message: 'Déconnecté.' });
});

// ---------- GET /me ----------
router.get('/me', requireAdmin, (req, res) => {
  res.json({ ok: true });
});

// ---------- GET /submissions ----------
router.get('/submissions', requireAdmin, async (req, res, next) => {
  try {
    const rows = await Submission.findAllWithUser();
    res.json({ submissions: rows.map(toClientShape) });
  } catch (err) {
    next(err);
  }
});

// ---------- PATCH /submissions/:id ----------
router.patch(
  '/submissions/:id',
  requireAdmin,
  [
    body('status').optional().isIn(['submitted', 'reviewed', 'selected']),
    body('adminNote').optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

      const existing = await Submission.findById(req.params.id);
      if (!existing) return res.status(404).json({ message: 'Soumission introuvable.' });

      const submission = await Submission.updateStatusAndNote(req.params.id, {
        status: req.body.status,
        adminNote: req.body.adminNote,
      });
      res.json({ submission: toClientShape({ ...submission, user_name: null, user_email: null, user_phone: null }) });
    } catch (err) {
      next(err);
    }
  }
);

// ---------- GET /submissions/:id/file (download) ----------
// The frontend fetches this with the Authorization header attached and
// triggers the download from the resulting blob (see admin-panel/js/admin.js),
// since a plain link/window.open can't carry a custom header.
router.get('/submissions/:id/file', requireAdmin, async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission || !submission.file_stored_name) {
      return res.status(404).json({ message: 'Aucun fichier pour cette soumission.' });
    }

    const filePath = path.join(UPLOAD_DIR, submission.file_stored_name);
    res.download(filePath, submission.file_original_name || 'projet.zip');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
