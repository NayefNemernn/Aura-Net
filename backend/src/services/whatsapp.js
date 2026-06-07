const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const { WA_AUTH_DIR } = require('../config/paths');

let waClient = null;
let waStatus = 'disconnected'; // 'disconnected' | 'qr' | 'connecting' | 'ready'
let waQR     = null;
let reconnectTimer  = null;
let manualDisconnect = false; // set when the user clicks "Disconnect"

function getState() {
  return { status: waStatus, qr: waQR };
}

// Re-initialize from the saved LocalAuth session after an unexpected drop.
// No QR is needed unless the phone logged the session out, in which case
// initialize() will surface a fresh QR instead of crashing.
function scheduleReconnect(delay = 5000) {
  if (manualDisconnect || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    console.log('🔄 WhatsApp auto-reconnecting…');
    initialize();
  }, delay);
}

async function initialize() {
  if (waClient) return;
  manualDisconnect = false;
  waStatus = 'connecting';

  waClient = new Client({
    authStrategy: new LocalAuth({ dataPath: WA_AUTH_DIR }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox', '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', '--disable-gpu',
        '--single-process', '--no-zygote',
      ],
    },
  });

  waClient.on('qr', async (qr) => {
    waStatus = 'qr';
    waQR = await QRCode.toDataURL(qr);
    console.log('📱 WhatsApp QR ready — scan it in Settings');
  });

  waClient.on('authenticated', () => {
    waStatus = 'connecting';
    waQR = null;
  });

  waClient.on('ready', () => {
    waStatus = 'ready';
    waQR = null;
    console.log('✅ WhatsApp ready');
  });

  waClient.on('disconnected', (reason) => {
    console.log('❌ WhatsApp disconnected:', reason);
    waStatus = 'disconnected';
    waQR = null;
    waClient = null;
    scheduleReconnect();
  });

  waClient.on('auth_failure', () => {
    waStatus = 'disconnected';
    waQR = null;
    waClient = null;
    scheduleReconnect();
  });

  waClient.initialize().catch(err => {
    console.error('WhatsApp init error:', err.message);
    waStatus = 'disconnected';
    waClient = null;
    scheduleReconnect(15000);
  });
}

// Ensure the client is connected and ready, kicking off a session restore if
// needed. Resolves true once 'ready', or false if it stalls / needs a QR scan.
async function ensureReady(timeoutMs = 60000) {
  if (waStatus === 'ready') return true;
  initialize();
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (waStatus === 'ready') return true;
    if (waStatus === 'qr')    return false; // needs a manual scan — don't block
    await new Promise(r => setTimeout(r, 1000));
  }
  return waStatus === 'ready';
}

async function disconnect() {
  manualDisconnect = true;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (waClient) {
    try { await waClient.destroy(); } catch (_) {}
    waClient = null;
  }
  waStatus = 'disconnected';
  waQR = null;
}

// Normalise a raw phone string to a WhatsApp chat id.
// Defaults to Lebanon country code 961 if no country code present.
function chatId(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) throw new Error(`Invalid phone: ${phone}`);
  const withCC = digits.startsWith('961') || digits.length > 10 ? digits : `961${digits}`;
  return `${withCC}@c.us`;
}

async function sendMessage(phone, text) {
  if (waStatus !== 'ready') throw new Error('WhatsApp not connected');
  await waClient.sendMessage(chatId(phone), text);
}

// Send media (base64, no data-URL prefix) with an optional text caption.
async function sendMedia(phone, { mimetype, base64, filename }, caption) {
  if (waStatus !== 'ready') throw new Error('WhatsApp not connected');
  const media = new MessageMedia(mimetype, base64, filename);
  await waClient.sendMessage(chatId(phone), media, caption ? { caption } : {});
}

const sendImage    = (phone, base64, caption) =>
  sendMedia(phone, { mimetype: 'image/png', base64, filename: 'website-qr.png' }, caption);
const sendDocument = (phone, base64, mimetype, filename, caption) =>
  sendMedia(phone, { mimetype, base64, filename }, caption);

module.exports = { initialize, ensureReady, disconnect, getState, sendMessage, sendImage, sendDocument };
