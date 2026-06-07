const Client = require('../models/Client');
const User   = require('../models/User');
const wa     = require('./whatsapp');

// Fallbacks for users created before the messaging templates existed.
const DEFAULTS = {
  reminderExpired: '🔴 عزيزي {name}،\n\nلقد انتهى اشتراك الإنترنت الخاص بك *اليوم*. يرجى التواصل معنا للتجديد لتجنّب انقطاع الخدمة.\n\n———\n\n🔴 Dear {name},\n\nYour internet subscription has expired *today*. Please contact us to renew and avoid disconnection.',
  reminderSoon:    '⚠️ عزيزي {name}،\n\nسينتهي اشتراك الإنترنت الخاص بك خلال *{days} يوم* بتاريخ ({expiry}). يرجى التجديد قريباً للبقاء متصلاً.\n\n———\n\n⚠️ Dear {name},\n\nYour internet subscription expires in *{days} days* ({expiry}). Please renew soon to stay connected.',
  footer:          '— أورا نت | Aura Net',
};

const applyTemplate = (tpl, vars) =>
  String(tpl).replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ''));

// Build a renewal-reminder message for one client using the owner's custom
// templates + footer. Picks the "expired" vs "expiring soon" template based on
// how many days remain (<= 0 days → expired).
function buildReminderMessage(user, client) {
  const m    = user.messaging || {};
  const name = client.name || client.username;

  let days = 2;
  if (client.expiry) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    days = Math.max(0, Math.round((new Date(client.expiry) - today) / 864e5));
  }

  const tpl  = days <= 0
    ? (m.reminderExpired || DEFAULTS.reminderExpired)
    : (m.reminderSoon    || DEFAULTS.reminderSoon);
  const body = applyTemplate(tpl, { name, expiry: client.expiry || '', days });

  const footer = m.footer != null ? m.footer : DEFAULTS.footer;
  return footer && footer.trim() ? `${body}\n\n${footer}` : body;
}

async function sendExpiryReminders() {
  // Try to restore the saved session if it dropped, rather than bailing.
  if (wa.getState().status !== 'ready') await wa.ensureReady(60000).catch(() => {});
  if (wa.getState().status !== 'ready') {
    console.log('⚠️  Reminders skipped — WhatsApp not connected (scan the QR in Settings)');
    return 0;
  }

  const today = new Date().toISOString().split('T')[0];
  const in2d  = new Date(Date.now() + 2 * 864e5).toISOString().split('T')[0];

  const users = await User.find({ isActive: true });
  let sent = 0;

  for (const user of users) {
    const clients = await Client.find({
      owner: user._id,
      expiry: { $in: [today, in2d] },
      remindersEnabled: { $ne: false },
      $or: [{ phone: { $ne: '' } }, { mobile: { $ne: '' } }],
    });

    for (const c of clients) {
      const msg = buildReminderMessage(user, c);

      try {
        await wa.sendMessage(c.phone || c.mobile, msg);
        sent++;
        await new Promise(r => setTimeout(r, 1500)); // avoid WA spam detection
      } catch (e) {
        console.error(`WA send failed → ${c.phone}:`, e.message);
      }
    }
  }

  console.log(`📱 Renewal reminders sent: ${sent}`);
  return sent;
}

module.exports = { sendExpiryReminders, buildReminderMessage };
