const router = require('express').Router();
const Client = require('../models/Client');
const { auth } = require('../middleware/auth');
router.use(auth);

// GET /api/clients
router.get('/', async (req, res) => {
  try {
    const { status, search, paid, page = 1, limit = 200 } = req.query;
    const q = { owner: req.user._id };
    if (status && status !== 'all') q.status = status;
    if (paid === 'paid')   q.paid = true;
    if (paid === 'unpaid') q.paid = { $ne: true };
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
    const oid   = req.user._id;
    const today = new Date().toISOString().split('T')[0];
    const soon  = new Date(Date.now() + 7*864e5).toISOString().split('T')[0];
    const [total, online, active, inactive, expired, pending, expiringSoon] = await Promise.all([
      Client.countDocuments({ owner: oid }),
      Client.countDocuments({ owner: oid, status: 'online' }),
      Client.countDocuments({ owner: oid, status: 'active' }),
      Client.countDocuments({ owner: oid, status: 'inactive' }),
      Client.countDocuments({ owner: oid, status: 'expired' }),
      Client.countDocuments({ owner: oid, status: 'pending' }),
      Client.countDocuments({ owner: oid, expiry: { $gte: today, $lte: soon } }),
    ]);
    res.json({ success: true, stats: { total, online, active, inactive, expired, pending, expiringSoon } });
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

// Fields an admin may fill/edit on a client profile. Volatile/live BMS fields
// (status, ip, uptime, quotas, etc.) and system fields are intentionally excluded.
const EDITABLE_FIELDS = [
  'name','address','phone','mobile','profile','expiry','startDate','note',
  'buildingDetail','sector','station','cpe','radioName','rxccq','signalNoise',
  'signalStrength','routerOsVersion','fq','sellingPrice','vlan','nationality',
  'whishPayments','zone',
];

// PATCH /api/clients/:id  — admin edits profile fields (saved to our DB)
router.patch('/:id', async (req, res) => {
  try {
    const c = await Client.findOne({ _id: req.params.id, owner: req.user._id });
    if (!c) return res.status(404).json({ error: 'Not found' });
    let changed = false;
    for (const f of EDITABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, f)) {
        c[f] = typeof req.body[f] === 'string' ? req.body[f].trim() : req.body[f];
        changed = true;
      }
    }
    if (changed) c.adminUpdatedAt = new Date();
    await c.save();
    res.json({ success: true, client: c });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/clients/:id/paid
router.patch('/:id/paid', async (req, res) => {
  try {
    const c = await Client.findOne({ _id: req.params.id, owner: req.user._id });
    if (!c) return res.status(404).json({ error: 'Not found' });
    c.paid = !c.paid;
    await c.save();
    res.json({ success: true, paid: c.paid });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/clients/:id/reminders
router.patch('/:id/reminders', async (req, res) => {
  try {
    const c = await Client.findOne({ _id: req.params.id, owner: req.user._id });
    if (!c) return res.status(404).json({ error: 'Not found' });
    c.remindersEnabled = !c.remindersEnabled;
    await c.save();
    res.json({ success: true, remindersEnabled: c.remindersEnabled });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
