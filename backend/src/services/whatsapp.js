const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const path   = require('path');

let waClient = null;
let waStatus = 'disconnected'; // 'disconnected' | 'qr' | 'connecting' | 'ready'
let waQR     = null;

function getState() {
  return { status: waStatus, qr: waQR };
}

async function initialize() {
  if (waClient) return;
  waStatus = 'connecting';

  waClient = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '../../data/wwebjs_auth') }),
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
  });

  waClient.on('auth_failure', () => {
    waStatus = 'disconnected';
    waQR = null;
    waClient = null;
  });

  waClient.initialize().catch(err => {
    console.error('WhatsApp init error:', err.message);
    waStatus = 'disconnected';
    waClient = null;
  });
}

async function disconnect() {
  if (waClient) {
    try { await waClient.destroy(); } catch (_) {}
    waClient = null;
  }
  waStatus = 'disconnected';
  waQR = null;
}

// phone: raw string from BMS (digits only after stripping)
// Defaults to Lebanon country code 961 if no country code present
async function sendMessage(phone, text) {
  if (waStatus !== 'ready') throw new Error('WhatsApp not connected');
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) throw new Error(`Invalid phone: ${phone}`);
  const withCC = digits.startsWith('961') || digits.length > 10 ? digits : `961${digits}`;
  await waClient.sendMessage(`${withCC}@c.us`, text);
}

module.exports = { initialize, disconnect, getState, sendMessage };
