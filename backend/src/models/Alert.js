const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sev:         { type: String, enum: ['critical','warning','info','ok'], required: true },
  title:       { type: String, required: true },
  detail:      { type: String, default: '' },
  rule:        { type: String, default: '' },
  dismissed:   { type: Boolean, default: false, index: true },
  dismissedAt: Date,
}, { timestamps: true });

AlertSchema.index({ owner: 1, dismissed: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', AlertSchema);
