// One-off migration: convert saved per-admin reminder templates to bilingual
// (Arabic + English). The reminder bodies are replaced with the bilingual
// defaults; the footer keeps everything the admin set (e.g. phone) but has its
// "Aura Net" brand line bilingual-ized when it has no Arabic yet.
//
// Run from backend/:  node scripts/migrate-bilingual-templates.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const BILINGUAL = {
  reminderExpired: '🔴 عزيزي {name}،\n\nلقد انتهى اشتراك الإنترنت الخاص بك *اليوم*. يرجى التواصل معنا للتجديد لتجنّب انقطاع الخدمة.\n\n———\n\n🔴 Dear {name},\n\nYour internet subscription has expired *today*. Please contact us to renew and avoid disconnection.',
  reminderSoon:    '⚠️ عزيزي {name}،\n\nسينتهي اشتراك الإنترنت الخاص بك خلال *{days} يوم* بتاريخ ({expiry}). يرجى التجديد قريباً للبقاء متصلاً.\n\n———\n\n⚠️ Dear {name},\n\nYour internet subscription expires in *{days} days* ({expiry}). Please renew soon to stay connected.',
};

const hasArabic = (s = '') => /[؀-ۿ]/.test(s);

(async () => {
  await mongoose.connect(process.env.MONGODB_URL);
  const users = await User.find({}, 'email role messaging');
  console.log(`Found ${users.length} user(s)\n`);

  for (const u of users) {
    const m = u.messaging || {};
    const oldFooter = m.footer || '';
    // Keep the footer text (phone etc.) but bilingual-ize the brand line.
    const newFooter = hasArabic(oldFooter)
      ? oldFooter
      : oldFooter.replace(/Aura Net/g, 'أورا نت | Aura Net');

    console.log(`— ${u.email} (${u.role})`);
    console.log('  footer:', JSON.stringify(oldFooter), '→', JSON.stringify(newFooter));

    await User.updateOne({ _id: u._id }, {
      $set: {
        'messaging.reminderExpired': BILINGUAL.reminderExpired,
        'messaging.reminderSoon':    BILINGUAL.reminderSoon,
        'messaging.footer':          newFooter,
      },
    });
  }

  console.log('\n✓ Done');
  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
