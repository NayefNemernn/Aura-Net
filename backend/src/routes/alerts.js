const router = require('express').Router();
const Alert  = require('../models/Alert');
const { auth, requireAdmin } = require('../middleware/auth');
router.use(auth, requireAdmin);

// GET /api/alerts
router.get('/', async (req, res) => {
  try {
    const { sev, limit = 100 } = req.query;
    const q = { owner: req.user._id, dismissed: false };
    if (sev && sev !== 'all') q.sev = sev;
    const [alerts, counts] = await Promise.all([
      Alert.find(q).sort({ createdAt: -1 }).limit(+limit),
      Alert.aggregate([
        { $match: { owner: req.user._id, dismissed: false } },
        { $group: { _id: '$sev', count: { $sum: 1 } } },
      ]),
    ]);
    const countMap = { critical: 0, warning: 0, info: 0, ok: 0 };
    counts.forEach(c => { countMap[c._id] = c.count; });
    res.json({ success: true, alerts, counts: countMap });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/alerts/:id/dismiss
router.patch('/:id/dismiss', async (req, res) => {
  try {
    await Alert.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { dismissed: true, dismissedAt: new Date() },
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/alerts/dismiss-all
router.post('/dismiss-all', async (req, res) => {
  try {
    const { sev } = req.body;
    const q = { owner: req.user._id, dismissed: false };
    if (sev && sev !== 'all') q.sev = sev;
    const r = await Alert.updateMany(q, { dismissed: true, dismissedAt: new Date() });
    res.json({ success: true, dismissed: r.modifiedCount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
