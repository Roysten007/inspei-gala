const multer = require('multer');

function notFound(req, res) {
  res.status(404).json({ message: 'Ressource introuvable.' });
}

function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `Fichier trop volumineux (max ${process.env.MAX_FILE_SIZE_MB || 100} Mo).`
        : 'Erreur lors du téléversement du fichier.';
    return res.status(400).json({ message });
  }

  if (err && err.message && err.message.includes('non autorisé')) {
    return res.status(400).json({ message: err.message });
  }

  console.error('[ERROR]', err);
  const status = err.status || 500;
  const message = status === 500 ? 'Une erreur interne est survenue. Réessayez plus tard.' : err.message;
  res.status(status).json({ message });
}

module.exports = { notFound, errorHandler };
