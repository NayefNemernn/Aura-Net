const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bmsId:    { type: String, required: true },

  name:         { type: String, trim: true, default: '' },
  username:     { type: String, trim: true, default: '' },
  status:       { type: String, enum: ['online','active','inactive','pending','expired'], default: 'inactive', index: true },
  profile:      { type: String, default: '' },
  group:        { type: String, default: '' },
  expiry:       { type: String, default: '' },
  startDate:    { type: String, default: '' },
  lastSeen:     { type: String, default: '' },
  phone:        { type: String, default: '' },
  ipAddress:    { type: String, default: '' },
  mac:          { type: String, default: '' },
  address:      { type: String, default: '' },
  uptime:       { type: String, default: '' },
  dailyQuota:   { type: String, default: '' },
  monthlyQuota: { type: String, default: '' },

  mobile:           { type: String, default: '' },
  fup:              { type: Boolean, default: false },
  autoRefill:       { type: Boolean, default: false },
  currentSpeed:     { type: String, default: '' },
  remindersEnabled: { type: Boolean, default: true, index: true },

  paid:       { type: Boolean, default: false, index: true },
  prevStatus: { type: String, default: '' },
  note:       { type: String, default: '' },
  syncedAt:   { type: Date, default: Date.now },
}, { timestamps: true });

// compound unique: one bmsId per user
ClientSchema.index({ owner: 1, bmsId: 1 }, { unique: true });
ClientSchema.index({ owner: 1, expiry: 1 });
ClientSchema.index({ owner: 1, lastSeen: 1 });

module.exports = mongoose.model('Client', ClientSchema);
