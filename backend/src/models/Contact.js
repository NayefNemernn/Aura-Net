const mongoose = require('mongoose');
const s = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  phone:   { type: String, required: true, trim: true },
  email:   { type: String, trim: true },
  subject: { type: String, trim: true },
  message: { type: String, required: true, trim: true },
  read:    { type: Boolean, default: false },
}, { timestamps: true });
module.exports = mongoose.model('Contact', s);
