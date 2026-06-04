const express = require('express');
const router  = express.Router();
const Contact = require('../models/Contact');
const { auth, requireAdmin } = require('../middleware/auth');
const { notifyAdmins, escapeHtml } = require('../services/telegram');

// Public — anyone can submit
router.post('/', async (req, res) => {
  const { name, phone, email, subject, message } = req.body;
  if (!name || !phone || !message) return res.status(400).json({ error: 'Name, phone and message are required' });
  try {
    const doc = await Contact.create({ name, phone, email, subject, message });

    // Fire-and-forget Telegram notification to admins — never blocks or fails
    // the visitor's request if Telegram is down or unconfigured.
    const text = [
      '📥 <b>New website message</b>',
      `<b>Name:</b> ${escapeHtml(name)}`,
      `<b>Phone:</b> ${escapeHtml(phone)}`,
      email   ? `<b>Email:</b> ${escapeHtml(email)}`     : null,
      subject ? `<b>Subject:</b> ${escapeHtml(subject)}` : null,
      '',
      escapeHtml(message),
    ].filter(Boolean).join('\n');
    notifyAdmins(text).catch(() => {});

    res.status(201).json({ success: true, id: doc._id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin — list messages + unread count (requires auth)
router.get('/', auth, requireAdmin, async (req, res) => {
  const [contacts, unread] = await Promise.all([
    Contact.find().sort({ createdAt: -1 }).limit(200),
    Contact.countDocuments({ read: false }),
  ]);
  res.json({ contacts, unread });
});

// Admin — unread count only (cheap, for sidebar badge / polling)
router.get('/unread-count', auth, requireAdmin, async (req, res) => {
  const unread = await Contact.countDocuments({ read: false });
  res.json({ unread });
});

// Admin — mark one as read/unread
router.patch('/:id/read', auth, requireAdmin, async (req, res) => {
  const read = req.body?.read === undefined ? true : !!req.body.read;
  await Contact.findByIdAndUpdate(req.params.id, { read });
  res.json({ success: true });
});

// Admin — mark all as read
router.post('/read-all', auth, requireAdmin, async (req, res) => {
  await Contact.updateMany({ read: false }, { read: true });
  res.json({ success: true });
});

// Admin — delete a message
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  await Contact.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
