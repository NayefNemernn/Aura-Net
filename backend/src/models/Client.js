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

  // ── Extended BMS fields (seeded from BMS; blank ones are admin-editable) ──
  buildingDetail:   { type: String, default: '' },   // BMS "B.D."
  sector:           { type: String, default: '' },
  station:          { type: String, default: '' },
  cpe:              { type: String, default: '' },
  radioName:        { type: String, default: '' },
  rxccq:            { type: String, default: '' },
  signalNoise:      { type: String, default: '' },
  signalStrength:   { type: String, default: '' },
  routerOsVersion:  { type: String, default: '' },
  fq:               { type: String, default: '' },    // BMS "F-Q" (ON/OFF)
  sellingPrice:     { type: String, default: '' },
  vlan:             { type: String, default: '' },
  nationality:      { type: String, default: '' },
  whishPayments:    { type: String, default: '' },
  zone:             { type: String, default: '' },

  paid:          { type: Boolean, default: false, index: true },
  prevStatus:    { type: String, default: '' },
  note:          { type: String, default: '' },
  adminUpdatedAt: { type: Date },                     // set when an admin edits the profile
  syncedAt:      { type: Date, default: Date.now },
}, { timestamps: true });

// compound unique: one bmsId per user
ClientSchema.index({ owner: 1, bmsId: 1 }, { unique: true });
ClientSchema.index({ owner: 1, expiry: 1 });
ClientSchema.index({ owner: 1, lastSeen: 1 });

module.exports = mongoose.model('Client', ClientSchema);
