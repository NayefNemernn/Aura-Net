const express = require('express');
const router  = express.Router();
const Contact = require('../models/Contact');
const { auth } = require('../middleware/auth');

// Public — anyone can submit
router.post('/', async (req, res) => {
  const { name, phone, email, subject, message } = req.body;
  if (!name || !phone || !message) return res.status(400).json({ error: 'Name, phone and message are required' });
  try {
    const doc = await Contact.create({ name, phone, email, subject, message });
    res.status(201).json({ success: true, id: doc._id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin — list messages (requires auth)
router.get('/', auth, async (req, res) => {
  const docs = await Contact.find().sort({ createdAt: -1 }).limit(100);
  res.json({ contacts: docs });
});

// Admin — mark as read
router.patch('/:id/read', auth, async (req, res) => {
  await Contact.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ success: true });
});

module.exports = router;
