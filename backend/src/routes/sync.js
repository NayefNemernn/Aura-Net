const router  = require('express').Router();
const SyncLog = require('../models/SyncLog');
const scraper = require('../services/scraper');
const { auth } = require('../middleware/auth');
router.use(auth);

// POST /api/sync  – trigger manual sync
router.post('/', async (req, res) => {
  try {
    const result = await scraper.syncUser(req.user);
    res.json(result);
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// GET /api/sync/history
router.get('/history', async (req, res) => {
  try {
    const logs = await SyncLog.find({ owner: req.user._id }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, logs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/sync/latest
router.get('/latest', async (req, res) => {
  try {
    const log = await SyncLog.findOne({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, log });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
