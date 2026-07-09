const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_EXT = ['.zip', '.rar', '.7z'];
const ALLOWED_MIME = [
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/x-7z-compressed',
  'application/octet-stream', // some browsers report archives generically — extension check below still applies
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Never trust the original filename for the path on disk.
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = crypto.randomBytes(24).toString('hex') + ext;
    cb(null, randomName);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    return cb(new Error('Format de fichier non autorisé. Utilisez .zip, .rar ou .7z.'));
  }
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(new Error('Type de fichier non reconnu.'));
  }
  cb(null, true);
}

const maxSizeBytes = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 100) * 1024 * 1024;

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeBytes, files: 1 },
});

module.exports = { upload, UPLOAD_DIR };
