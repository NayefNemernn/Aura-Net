const User = require('../models/User');

const BASE = 'https://api.telegram.org/bot';

// Escape the characters special to Telegram's HTML parse mode.
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendMessage(token, chatId, text) {
  if (!token || !chatId || !text) return null;
  try {
    const res = await fetch(`${BASE}${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    return await res.json();
  } catch (e) {
    console.error('Telegram send error:', e.message);
    return null;
  }
}

async function getMe(token) {
  try {
    const res = await fetch(`${BASE}${token}/getMe`);
    return await res.json();
  } catch (e) { return { ok: false, error: e.message }; }
}

// Returns the latest chat ID from whoever messaged the bot
async function detectChatId(token) {
  try {
    const res  = await fetch(`${BASE}${token}/getUpdates?limit=10&offset=-10`);
    const data = await res.json();
    if (!data.ok || !data.result?.length) return null;
    const last = data.result[data.result.length - 1];
    return String(last.message?.chat?.id || last.channel_post?.chat?.id || '');
  } catch (e) { return null; }
}

// Severity → icon
const SEV_ICON = { critical: '🔴', warning: '⚠️', info: 'ℹ️', ok: '✅' };

async function sendAlert(user, sev, title, detail) {
  if (!user.telegramToken || !user.telegramChatId) return;
  const rules = user.telegramAlerts || {};
  if (sev === 'ok'       && rules.syncOk      === false) return;
  if (sev === 'critical' && rules.critical     === false) return;
  if (sev === 'warning'  && rules.statusChange === false) return;

  const icon = SEV_ICON[sev] || 'ℹ️';
  const text = `${icon} <b>${title}</b>${detail ? `\n${detail}` : ''}`;
  await sendMessage(user.telegramToken, user.telegramChatId, text);
}

// Broadcast an HTML message to every active admin who has Telegram set up.
// Used for account-level notifications (e.g. a new website contact message)
// that aren't tied to a single user's per-alert rules. Never throws.
async function notifyAdmins(text) {
  try {
    const admins = await User.find({
      role:           { $in: ['admin', 'superadmin'] },
      isActive:       true,
      telegramToken:  { $ne: '' },
      telegramChatId: { $ne: '' },
    }).select('telegramToken telegramChatId');
    await Promise.all(admins.map(u => sendMessage(u.telegramToken, u.telegramChatId, text)));
    return admins.length;
  } catch (e) {
    console.error('Telegram notifyAdmins error:', e.message);
    return 0;
  }
}

module.exports = { sendMessage, getMe, detectChatId, sendAlert, notifyAdmins, escapeHtml };
