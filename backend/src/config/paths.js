const path = require('path');

// Single persistent root for everything that must survive restarts/redeploys.
// On Railway the backend's ephemeral filesystem is wiped on every redeploy, so
// this directory MUST be backed by a mounted volume (mount path: /app/data).
// Everything that writes to disk (uploaded images, the WhatsApp LocalAuth
// session) lives inside here so a single volume covers it all.
//
// DATA_DIR can override the location (defaults to backend/data).
const DATA_DIR    = process.env.DATA_DIR || path.join(__dirname, '../../data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');        // served at URL /uploads
const WA_AUTH_DIR = path.join(DATA_DIR, 'wwebjs_auth');    // whatsapp-web.js LocalAuth

module.exports = { DATA_DIR, UPLOADS_DIR, WA_AUTH_DIR };
