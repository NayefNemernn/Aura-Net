const router    = require('express').Router();
const { auth, requireAdmin }  = require('../middleware/auth');
const wa        = require('../services/whatsapp');
const reminders = require('../services/reminders');
const Client    = require('../models/Client');

router.use(auth, requireAdmin);

const DEFAULT_TEST_MESSAGE = 'Test Reminder Message From ABBAs Nemer - Developer';

// GET /api/whatsapp/status
router.get('/status', (req, res) => {
  res.json({ success: true, ...wa.getState() });
});

// POST /api/whatsapp/connect
router.post('/connect', (req, res) => {
  wa.initialize();
  res.json({ success: true });
});

// POST /api/whatsapp/disconnect
router.post('/disconnect', async (req, res) => {
  try {
    await wa.disconnect();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/whatsapp/send-reminders
router.post('/send-reminders', async (req, res) => {
  try {
    const sent = await reminders.sendExpiryReminders();
    res.json({ success: true, sent });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/whatsapp/test-reminder  — send a test message to one client now
// (ignores the expiry window). Body: { clientId, message? }
router.post('/test-reminder', async (req, res) => {
  try {
    const { clientId, message } = req.body;
    if (!clientId) return res.status(400).json({ error: 'clientId is required' });
    const { status } = wa.getState();
    if (status !== 'ready') return res.status(400).json({ error: 'WhatsApp not connected — connect it first' });
    const client = await Client.findOne({ _id: clientId, owner: req.user._id });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    const phone = client.phone || client.mobile;
    if (!phone) return res.status(400).json({ error: 'This client has no phone number on file' });
    const text = (message && message.trim()) || DEFAULT_TEST_MESSAGE;
    await wa.sendMessage(phone, text);
    res.json({ success: true, sentTo: phone, message: text });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
