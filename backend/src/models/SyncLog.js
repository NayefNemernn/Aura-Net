const mongoose = require('mongoose');

const SyncLogSchema = new mongoose.Schema({
  owner:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status:         { type: String, enum: ['running','success','error'], default: 'running' },
  clientsFound:   { type: Number, default: 0 },
  clientsNew:     { type: Number, default: 0 },
  clientsUpdated: { type: Number, default: 0 },
  clientsRemoved: { type: Number, default: 0 },
  alertsCreated:  { type: Number, default: 0 },
  durationMs:     { type: Number, default: 0 },
  error:          { type: String, default: '' },
  steps: [{
    label:  String,
    status: { type: String, enum: ['pending','running','done','error'] },
    ts:     Date,
  }],
}, { timestamps: true });

SyncLogSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('SyncLog', SyncLogSchema);
