const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:    { type: String, default: '', trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role:     { type: String, enum: ['superadmin', 'admin', 'viewer'], default: 'admin' },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  refreshToken: { type: String, select: false },

  // BMS connection (per-user, overrides .env defaults)
  bmsUrl:  { type: String, default: '' },
  bmsUser: { type: String, default: '' },
  bmsPass: { type: String, default: '', select: false },

  syncInterval: { type: Number, default: 60 }, // minutes

  alertRules: {
    inactive30:   { type: Boolean, default: true },
    statusChange: { type: Boolean, default: true },
    batchNew:     { type: Boolean, default: true },
    expiry7d:     { type: Boolean, default: true },
    drop10pct:    { type: Boolean, default: false },
    syncOk:       { type: Boolean, default: true },
  },

  notifications: {
    emailEnabled: { type: Boolean, default: false },
    emailAddr:    { type: String,  default: '' },
  },

  // Whish Money payment collection (generic account QR — no merchant API needed)
  whish: {
    payLink:         { type: String, default: '' },   // Whish "pay me" URL (encoded in the QR)
    number:          { type: String, default: '' },   // Whish account / phone number
    accountName:     { type: String, default: '' },
    note:            { type: String, default: '' },
    messageTemplate: { type: String, default: 'Hello {name}, you can pay your Aura Net subscription via Whish Money:\n{link}\n\nThank you!' },
  },

  // WhatsApp message customisation. Templates support {name}, {expiry}, {days}
  // placeholders. The footer is appended to reminder messages (and optionally
  // to composed broadcasts).
  messaging: {
    reminderExpired: { type: String, default: '🔴 عزيزي {name}،\n\nلقد انتهى اشتراك الإنترنت الخاص بك *اليوم*. يرجى التواصل معنا للتجديد لتجنّب انقطاع الخدمة.\n\n———\n\n🔴 Dear {name},\n\nYour internet subscription has expired *today*. Please contact us to renew and avoid disconnection.' },
    reminderSoon:    { type: String, default: '⚠️ عزيزي {name}،\n\nسينتهي اشتراك الإنترنت الخاص بك خلال *{days} يوم* بتاريخ ({expiry}). يرجى التجديد قريباً للبقاء متصلاً.\n\n———\n\n⚠️ Dear {name},\n\nYour internet subscription expires in *{days} days* ({expiry}). Please renew soon to stay connected.' },
    footer:          { type: String, default: '— أورا نت | Aura Net' },
  },

  telegramToken:  { type: String, default: '' },
  telegramChatId: { type: String, default: '' },
  lastTelegramAt: { type: Date },   // throttle: forward alerts to Telegram at most once per hour
  telegramAlerts: {
    syncOk:       { type: Boolean, default: true },
    expirySoon:   { type: Boolean, default: true },
    statusChange: { type: Boolean, default: true },
    critical:     { type: Boolean, default: true },
  },
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

UserSchema.methods.toSafeObject = function () {
  const o = this.toObject();
  delete o.password;
  delete o.refreshToken;
  delete o.bmsPass;
  return o;
};

module.exports = mongoose.model('User', UserSchema);
