const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
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
