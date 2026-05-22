const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bmsId:    { type: String, required: true },

  name:      { type: String, trim: true, default: '' },
  username:  { type: String, trim: true, default: '' },
  status:    { type: String, enum: ['active','inactive','pending','expired'], default: 'active', index: true },
  profile:   { type: String, default: '' },
  group:     { type: String, default: '' },
  expiry:    { type: String, default: '' },
  lastSeen:  { type: String, default: '' },
  ipAddress: { type: String, default: '' },

  prevStatus: { type: String, default: '' }, // track status changes
  note:       { type: String, default: '' },
  syncedAt:   { type: Date, default: Date.now },
}, { timestamps: true });

// compound unique: one bmsId per user
ClientSchema.index({ owner: 1, bmsId: 1 }, { unique: true });
ClientSchema.index({ owner: 1, expiry: 1 });
ClientSchema.index({ owner: 1, lastSeen: 1 });

module.exports = mongoose.model('Client', ClientSchema);
