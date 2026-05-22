const router = require('express').Router();
const Client = require('../models/Client');
const { auth } = require('../middleware/auth');
router.use(auth);

// GET /api/clients
router.get('/', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 200 } = req.query;
    const q = { owner: req.user._id };
    if (status && status !== 'all') q.status = status;
    if (search) q.$or = [
      { name:     new RegExp(search, 'i') },
      { username: new RegExp(search, 'i') },
      { group:    new RegExp(search, 'i') },
    ];
    const [clients, total] = await Promise.all([
      Client.find(q).sort({ syncedAt: -1 }).skip((page-1)*limit).limit(+limit),
      Client.countDocuments(q),
    ]);
    res.json({ success: true, clients, total, page: +page, pages: Math.ceil(total/limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/clients/stats
router.get('/stats', async (req, res) => {
  try {
    const oid = req.user._id;
    const today = new Date().toISOString().split('T')[0];
    const soon  = new Date(Date.now() + 7*864e5).toISOString().split('T')[0];
    const stale = new Date(Date.now() - 30*864e5).toISOString().split('T')[0];
    const [total, active, inactive, pending, expiringSoon, staleCount] = await Promise.all([
      Client.countDocuments({ owner: oid }),
      Client.countDocuments({ owner: oid, status: 'active' }),
      Client.countDocuments({ owner: oid, status: 'inactive' }),
      Client.countDocuments({ owner: oid, status: 'pending' }),
      Client.countDocuments({ owner: oid, expiry: { $gte: today, $lte: soon } }),
      Client.countDocuments({ owner: oid, lastSeen: { $lt: stale, $ne: '' } }),
    ]);
    res.json({ success: true, stats: { total, active, inactive, pending, expiringSoon, stale: staleCount } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/clients/:id
router.get('/:id', async (req, res) => {
  try {
    const c = await Client.findOne({ _id: req.params.id, owner: req.user._id });
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, client: c });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
