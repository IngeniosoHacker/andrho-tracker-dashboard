require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const pool = require('./config/db');
const apiRoutes = require('./routes/api');

if (!process.env.JWT_SECRET) {
  console.error('[server] JWT_SECRET is not set. Refusing to start: every /api/sites/* route ' +
    'depends on it to verify tokens issued by andrho-api. Set JWT_SECRET (same value ' +
    'andrho-api signs with) and try again.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

const allowed = (process.env.ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim()).filter(Boolean);

// Public URL of andrho-api, injected into the analytics dashboard's HTML so
// its client-side JS knows where to call /auth/me, /auth/refresh and
// /auth/logout (see public/dashboard/index.html + app.js).
const ANDRHO_API_URL = process.env.ANDRHO_API_URL || '';
const DASHBOARD_DIR = path.join(__dirname, '..', 'public', 'dashboard');
const dashboardIndexTemplate = fs.readFileSync(path.join(DASHBOARD_DIR, 'index.html'), 'utf8');

// The web tracker script (loaded by the landing/login/signup pages, see
// web/index.html) lives on its own Railway service and both loads from and
// reports events back to that origin. andrho-api (ANDRHO_API_URL) is where
// login/signup/dashboard auth calls go -- both need explicit CSP allowances.
const TRACKER_ORIGIN = 'https://webtracker-production-b8d7.up.railway.app';
let andrhoApiOrigin = null;
if (ANDRHO_API_URL) {
  try {
    andrhoApiOrigin = new URL(ANDRHO_API_URL).origin;
  } catch (err) {
    console.error(`[server] ANDRHO_API_URL is not a valid URL: "${ANDRHO_API_URL}". It must be ` +
      'andrho-api\'s PUBLIC URL (e.g. https://andrho-api-production-xxxx.up.railway.app) -- browsers ' +
      'call this directly, so a Railway private-network hostname (*.railway.internal) will not work ' +
      'here even with a scheme prepended. Refusing to start.');
    process.exit(1);
  }
}

app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', TRACKER_ORIGIN],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", TRACKER_ORIGIN, ...(andrhoApiOrigin ? [andrhoApiOrigin] : [])]
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

// Official landing (/, /login.html, /signup.html) -- built from web/ via
// `npm --prefix web run build` (see railway.json / README.md).
app.use(express.static(path.join(__dirname, '..', 'web', 'dist'), { maxAge: '5m' }));

// Analytics dashboard, now JWT-protected, lives under /dashboard/. Its
// index.html gets ANDRHO_API_URL injected server-side on every request
// (cheap: it's a small static string substitution, not a template engine).
app.get(['/dashboard', '/dashboard/'], (req, res) => {
  res.type('html').send(dashboardIndexTemplate.replace('__ANDRHO_API_URL__', ANDRHO_API_URL));
});
app.use('/dashboard', express.static(DASHBOARD_DIR, { maxAge: '5m', index: false }));

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
