require('dotenv').config();
const express = require('express');
const path    = require('path');
const fs      = require('fs');
const jwt     = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const crypto  = require('crypto');

const app  = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET   = process.env.JWT_SECRET  || 'dev-fallback-secret';
const ADMIN_PASS   = process.env.ADMIN_PASSWORD;
const DATA_FILE    = path.join(__dirname, 'data.json');

if (!ADMIN_PASS) {
  console.error('ERROR: ADMIN_PASSWORD is not set in .env');
  process.exit(1);
}

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate-limit login to 5 attempts per 15 min
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth middleware – verifies Bearer JWT
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/auth/login
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { password } = req.body;
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required.' });
  }

  // Constant-time comparison to prevent timing attacks
  const a   = Buffer.from(password);
  const b   = Buffer.from(ADMIN_PASS);
  const len = Math.max(a.length, b.length);
  const pa  = Buffer.concat([a, Buffer.alloc(len - a.length)]);
  const pb  = Buffer.concat([b, Buffer.alloc(len - b.length)]);

  const match = crypto.timingSafeEqual(pa, pb) && a.length === b.length;
  if (!match) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

// GET /api/auth/verify
app.get('/api/auth/verify', authenticate, (_req, res) => {
  res.json({ valid: true });
});

// GET /api/data  (public)
app.get('/api/data', (_req, res) => {
  try {
    res.json(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
  } catch {
    res.status(500).json({ error: 'Could not load portfolio data.' });
  }
});

// PUT /api/data  (admin only)
app.put('/api/data', authenticate, (req, res) => {
  const data = req.body;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return res.status(400).json({ error: 'Invalid data format.' });
  }
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to save data.' });
  }
});

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  Portfolio → http://localhost:${PORT}`);
  console.log(`  Admin mode → press Ctrl+Shift+L on the site\n`);
});
