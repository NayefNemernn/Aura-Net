const router    = require('express').Router();
const { auth }  = require('../middleware/auth');
const wa        = require('../services/whatsapp');
const reminders = require('../services/reminders');

router.use(auth);

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

module.exports = router;
