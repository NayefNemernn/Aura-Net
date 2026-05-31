require('dotenv').config();

const express   = require('express');
const path      = require('path');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const cron      = require('node-cron');

const { connectDB } = require('./services/db');
const scraper       = require('./services/scraper');
const wa            = require('./services/whatsapp');
const reminders     = require('./services/reminders');

const authRoutes      = require('./routes/auth');
const clientRoutes    = require('./routes/clients');
const alertRoutes     = require('./routes/alerts');
const reportRoutes    = require('./routes/reports');
const syncRoutes      = require('./routes/sync');
const settingsRoutes  = require('./routes/settings');
const whatsappRoutes  = require('./routes/whatsapp');
const messagingRoutes = require('./routes/messaging');
const bmsActionsRoutes = require('./routes/bmsActions');
const contactRoutes    = require('./routes/contact');
const landingRoutes    = require('./routes/landing');
const paymentRoutes    = require('./routes/payments');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Security ──────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:4173',
    ].filter(Boolean);
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────────────────────────
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 30,  message: { error: 'Too many requests, slow down' } }));
app.use('/api',      rateLimit({ windowMs:  1 * 60 * 1000, max: 300, message: { error: 'Rate limit hit' } }));

// ── Body parsing ─────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// ── Routes ────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/clients',   clientRoutes);
app.use('/api/alerts',    alertRoutes);
app.use('/api/reports',   reportRoutes);
app.use('/api/sync',      syncRoutes);
app.use('/api/settings',  settingsRoutes);
app.use('/api/whatsapp',   whatsappRoutes);
app.use('/api/messaging',  messagingRoutes);
app.use('/api/bms',        bmsActionsRoutes);
app.use('/api/contact',    contactRoutes);
app.use('/api/landing',    landingRoutes);
app.use('/api/payments',   paymentRoutes);
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => res.json({
  status: 'ok', service: 'Aura Net API', version: '1.0.0', time: new Date().toISOString()
}));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, _next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

// ── Boot ──────────────────────────────────────────────────────────────
async function boot() {
  await connectDB();

  app.listen(PORT, () => console.log(`🚀 Aura Net API → port ${PORT}`));

  // Initial sync 45s after boot (give DB time to settle)
  setTimeout(() => scraper.syncAll().catch(console.error), 45_000);

  // Scheduled auto-sync for all users
  cron.schedule(process.env.SYNC_CRON || '0 * * * *', () => {
    console.log('⏰ Cron sync triggered');
    scraper.syncAll().catch(console.error);
  });

  // Daily expiry reminders — runs at 09:00 every day
  cron.schedule('0 9 * * *', () => {
    console.log('📱 Running daily WhatsApp expiry reminders');
    reminders.sendExpiryReminders().catch(console.error);
  });
}

boot();
module.exports = app;
