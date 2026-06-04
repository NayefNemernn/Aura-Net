const router = require('express').Router();
const User   = require('../models/User');
const { auth, requireAdmin } = require('../middleware/auth');
router.use(auth, requireAdmin);

// GET /api/settings
router.get('/', async (req, res) => {
  const u = await User.findById(req.user._id);
  res.json({
    success: true,
    settings: {
      name:           u.name,
      email:          u.email,
      bmsUrl:         u.bmsUrl,
      bmsUser:        u.bmsUser,
      syncInterval:   u.syncInterval,
      alertRules:     u.alertRules,
      notifications:  u.notifications,
      telegramToken:  u.telegramToken,
      telegramChatId: u.telegramChatId,
      telegramAlerts: u.telegramAlerts,
      whish:          u.whish,
      messaging:      u.messaging,
    },
  });
});

// PATCH /api/settings
router.patch('/', async (req, res) => {
  try {
    const allowed = ['name','bmsUrl','bmsUser','bmsPass','syncInterval','alertRules','notifications','telegramToken','telegramChatId','telegramAlerts','whish','messaging'];
    const updates = {};
    for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
    const u = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true });
    res.json({ success: true, settings: { name: u.name, email: u.email, bmsUrl: u.bmsUrl, bmsUser: u.bmsUser, syncInterval: u.syncInterval, alertRules: u.alertRules, notifications: u.notifications, telegramToken: u.telegramToken, telegramChatId: u.telegramChatId, telegramAlerts: u.telegramAlerts, whish: u.whish, messaging: u.messaging } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
