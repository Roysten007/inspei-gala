require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const path = require('path');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const REQUIRED_ENV = [
  'DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET', 'ADMIN_ROUTE_SECRET', 'ADMIN_PASSWORD_HASH', 'ADMIN_JWT_SECRET',
];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`[CONFIG] Variables d'environnement manquantes : ${missing.join(', ')}`);
  process.exit(1);
}

const app = express();

// Needed on platforms like Render/Railway/Heroku behind a reverse proxy,
// so req.ip is correct for rate limiting.
app.set('trust proxy', 1);

app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const allowedOrigins = (process.env.CLIENT_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(
  '/api',
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (no origin header) and configured origins only.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Origine non autorisée par la politique CORS.'));
    },
  })
);

app.use(express.json({ limit: '20kb' })); // submissions carry the file separately via multipart

// Global safety-net rate limit, on top of the stricter per-route limiters.
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);

// The admin panel lives at a path only known via the ADMIN_ROUTE_SECRET
// environment variable — it is never linked from the public site, is served
// from the backend itself (not the public frontend deploy), and is
// blocked from indexing via robots.txt on the frontend.
app.use(`/${process.env.ADMIN_ROUTE_SECRET}/api`, adminRoutes);
app.use(`/${process.env.ADMIN_ROUTE_SECRET}`, express.static(path.join(__dirname, 'admin-panel')));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`[SERVER] En écoute sur le port ${PORT}`));
});
