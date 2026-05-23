const router  = require('express').Router();
const { auth }= require('../middleware/auth');
const Client  = require('../models/Client');
const wa      = require('../services/whatsapp');
const tg      = require('../services/telegram');
const User    = require('../models/User');

router.use(auth);

// ── WhatsApp ──────────────────────────────────────────────────────────────

// POST /api/messaging/whatsapp/send
// Body: { clientIds: [...], message: "..." }
router.post('/whatsapp/send', async (req, res) => {
  try {
    const { clientIds, message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });
    if (!clientIds?.length) return res.status(400).json({ error: 'Select at least one client' });

    const { status } = wa.getState();
    if (status !== 'ready') return res.status(400).json({ error: 'WhatsApp not connected' });

    const clients = await Client.find({
      _id: { $in: clientIds },
      owner: req.user._id,
    });

    let sent = 0, failed = 0, skipped = 0;
    const errors = [];

    for (const c of clients) {
      const phone = c.phone || c.mobile;
      if (!phone) { skipped++; continue; }
      try {
        await wa.sendMessage(phone, message);
        sent++;
        await new Promise(r => setTimeout(r, 1200));
      } catch (e) {
        failed++;
        errors.push(`${c.name || c.username}: ${e.message}`);
      }
    }

    res.json({ success: true, sent, failed, skipped, errors });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/messaging/recipients
// Returns clients that have phone/mobile (for the recipient picker)
router.get('/recipients', async (req, res) => {
  try {
    const { search } = req.query;
    const q = {
      owner: req.user._id,
      $or: [{ phone: { $ne: '' } }, { mobile: { $ne: '' } }],
    };
    if (search) {
      q.$and = [{ $or: [
        { name:     new RegExp(search, 'i') },
        { username: new RegExp(search, 'i') },
        { phone:    new RegExp(search, 'i') },
        { mobile:   new RegExp(search, 'i') },
      ]}];
    }
    const clients = await Client.find(q)
      .select('name username phone mobile status expiry remindersEnabled')
      .sort({ name: 1 })
      .limit(300);
    res.json({ success: true, clients });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Telegram ──────────────────────────────────────────────────────────────

// GET /api/messaging/telegram/status
router.get('/telegram/status', async (req, res) => {
  try {
    const u = await User.findById(req.user._id);
    if (!u.telegramToken) return res.json({ success: true, status: 'not_configured' });
    const me = await tg.getMe(u.telegramToken);
    res.json({ success: true, status: me.ok ? 'ready' : 'invalid_token', bot: me.result || null });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/messaging/telegram/detect-chat
// Auto-detect chat ID from latest bot update
router.post('/telegram/detect-chat', async (req, res) => {
  try {
    const u  = await User.findById(req.user._id);
    if (!u.telegramToken) return res.status(400).json({ error: 'Bot token not configured' });
    const chatId = await tg.detectChatId(u.telegramToken);
    if (!chatId) return res.status(404).json({ error: 'No messages found. Send any message to your bot first, then click detect again.' });
    res.json({ success: true, chatId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/messaging/telegram/test
router.post('/telegram/test', async (req, res) => {
  try {
    const u = await User.findById(req.user._id);
    if (!u.telegramToken || !u.telegramChatId) return res.status(400).json({ error: 'Telegram not fully configured' });
    const result = await tg.sendMessage(u.telegramToken, u.telegramChatId, '✅ <b>Aura Net</b> — Telegram alerts are working!');
    if (!result?.ok) return res.status(400).json({ error: result?.description || 'Send failed' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/messaging/telegram/send
// Body: { message: "..." }
router.post('/telegram/send', async (req, res) => {
  try {
    const u = await User.findById(req.user._id);
    if (!u.telegramToken || !u.telegramChatId) return res.status(400).json({ error: 'Telegram not configured' });
    const result = await tg.sendMessage(u.telegramToken, u.telegramChatId, req.body.message || '');
    if (!result?.ok) return res.status(400).json({ error: result?.description || 'Send failed' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
