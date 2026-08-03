require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const pool = require('./config/db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

const allowed = (process.env.ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim()).filter(Boolean);

app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"]
    }
  },
  crossOriginResourcePolicy: false
}));
app.use(cors({
  origin(origin, cb) {
    if (!origin || allowed.includes('*') || allowed.includes(origin)) return cb(null, true);
    return cb(new Error('Origin not allowed'));
  }
}));

app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: '5m' }));
app.use('/api', apiRoutes);

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, postgres: true });
  } catch (e) {
    res.status(503).json({ ok: false, postgres: false });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'internal error' });
});

app.listen(PORT, () => {
  console.log(`[dashboard] listening on port ${PORT}`);
});
