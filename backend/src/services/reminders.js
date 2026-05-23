const Client = require('../models/Client');
const User   = require('../models/User');
const wa     = require('./whatsapp');

async function sendExpiryReminders() {
  const { status } = wa.getState();
  if (status !== 'ready') {
    console.log('⚠️  Reminders skipped — WhatsApp not connected');
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
      const isToday = c.expiry === today;
      const name    = c.name || c.username;
      const msg = isToday
        ? `🔴 Dear ${name},\n\nYour internet subscription has expired *today*. Please contact us to renew and avoid disconnection.\n\n— Aura Net`
        : `⚠️ Dear ${name},\n\nYour internet subscription expires in *2 days* (${c.expiry}). Please renew soon to stay connected.\n\n— Aura Net`;

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

module.exports = { sendExpiryReminders };
