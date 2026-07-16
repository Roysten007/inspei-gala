const express = require('express');
const fs = require('fs');
const path = require('path');
const { body, validationResult } = require('express-validator');

const Submission = require('../models/Submission');
const requireAuth = require('../middleware/auth');
const { upload, UPLOAD_DIR } = require('../middleware/upload');

const router = express.Router();

function submissionDeadlinePassed() {
  let deadline = process.env.SUBMISSION_DEADLINE;
  const fallbackDeadline = '2026-07-16T14:00:00.000Z';
  if (!deadline || new Date(deadline) < new Date(fallbackDeadline)) {
    deadline = fallbackDeadline;
  }
  return new Date() > new Date(deadline);
}

// ---------- GET /api/submissions/me ----------
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const submission = await Submission.findByUserId(req.user.id);
    if (!submission) return res.json({ submission: null });

    res.json({
      submission: {
        title: submission.title,
        team: submission.team,
        description: submission.description,
        projectLink: submission.project_link,
        hasFile: !!submission.file_stored_name,
        fileOriginalName: submission.file_original_name,
        status: submission.status,
        updatedAt: submission.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---------- POST /api/submissions (create or update — one project per user) ----------
router.post(
  '/',
  requireAuth,
  upload.single('file'),
  [
    body('title').trim().isLength({ min: 3, max: 150 }).withMessage('Titre invalide (3 à 150 caractères).'),
    body('description').trim().isLength({ min: 30, max: 3000 }).withMessage('Description trop courte (30 caractères minimum).'),
    body('team').optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
    body('projectLink').optional({ checkFalsy: true }).trim().isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('Lien invalide.'),
  ],
  async (req, res, next) => {
    try {
      if (submissionDeadlinePassed()) {
        if (req.file) fs.unlink(path.join(UPLOAD_DIR, req.file.filename), () => {});
        return res.status(403).json({ message: 'La période de soumission est terminée.' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        if (req.file) fs.unlink(path.join(UPLOAD_DIR, req.file.filename), () => {});
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { title, team, description, projectLink } = req.body;
      const existing = await Submission.findByUserId(req.user.id);

      if (!projectLink && !req.file) {
        const hasExistingLinkOrFile = existing && (existing.project_link || existing.file_stored_name);
        if (!hasExistingLinkOrFile) {
          if (req.file) fs.unlink(path.join(UPLOAD_DIR, req.file.filename), () => {});
          return res.status(400).json({ message: 'Ajoutez un lien ou un fichier (ou les deux).' });
        }
      }

      let originalName = req.file ? req.file.originalname : null;
      if (originalName) {
        const ext = path.extname(originalName).toLowerCase();
        if (['.zip', '.rar', '.7z'].includes(ext)) {
          const base = originalName.slice(0, -ext.length);
          if (base.toLowerCase().endsWith(ext)) {
            originalName = base;
          }
        }
      }

      const file = req.file
        ? {
            storedName: req.file.filename,
            originalName: originalName,
            size: req.file.size,
            mimeType: req.file.mimetype,
          }
        : null;

      const previousFile = existing?.file_stored_name;
      let submission;

      if (existing) {
        submission = await Submission.updateSubmission(existing.id, { title, team, description, projectLink, file });
      } else {
        submission = await Submission.createSubmission({ userId: req.user.id, title, team, description, projectLink, file });
      }

      // Clean up the previous file only after the new one is safely saved.
      if (file && previousFile) {
        fs.unlink(path.join(UPLOAD_DIR, previousFile), () => {});
      }

      res.status(200).json({ message: 'Soumission enregistrée.', submissionId: submission.id });
    } catch (err) {
      if (req.file) fs.unlink(path.join(UPLOAD_DIR, req.file.filename), () => {});
      next(err);
    }
  }
);

module.exports = router;
