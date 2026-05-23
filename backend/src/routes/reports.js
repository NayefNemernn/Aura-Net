const router  = require('express').Router();
const Client  = require('../models/Client');
const Alert   = require('../models/Alert');
const SyncLog = require('../models/SyncLog');
const { auth } = require('../middleware/auth');
router.use(auth);

// GET /api/reports/overview
router.get('/overview', async (req, res) => {
  try {
    const oid   = req.user._id;
    const today = new Date().toISOString().split('T')[0];
    const soon  = new Date(Date.now() + 7*864e5).toISOString().split('T')[0];
    const [total, online, active, inactive, expired, pending, expiringSoon, recentAlerts, lastSync] = await Promise.all([
      Client.countDocuments({ owner: oid }),
      Client.countDocuments({ owner: oid, status:'online' }),
      Client.countDocuments({ owner: oid, status:'active' }),
      Client.countDocuments({ owner: oid, status:'inactive' }),
      Client.countDocuments({ owner: oid, status:'expired' }),
      Client.countDocuments({ owner: oid, status:'pending' }),
      Client.countDocuments({ owner: oid, expiry:{ $gte:today, $lte:soon } }),
      Alert.find({ owner:oid, dismissed:false }).sort({ createdAt:-1 }).limit(5),
      SyncLog.findOne({ owner:oid }).sort({ createdAt:-1 }),
    ]);
    res.json({ success:true, report:{ generatedAt: new Date(), summary:{ total, online, active, inactive, expired, pending, expiringSoon }, activeRate: total?Math.round((online+active)/total*100):0, recentAlerts, lastSync } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/reports/clients?format=csv
router.get('/clients', async (req, res) => {
  try {
    const clients = await Client.find({ owner: req.user._id }).sort({ name:1 });
    if (req.query.format === 'csv') {
      const esc = v => `"${String(v||'').replace(/"/g,'""')}"`;
      const rows = ['ID,Name,Username,Status,Service,Expiry,Start Date,Last Seen,Phone,Mobile,IP,MAC,Address,Uptime,D.Quota,M.Quota,AutoRefill,FUP,Speed,Paid',
        ...clients.map(c => [c.bmsId,esc(c.name),esc(c.username),c.status,esc(c.profile),c.expiry,c.startDate,c.lastSeen,c.phone,c.mobile,c.ipAddress,c.mac,esc(c.address),c.uptime,esc(c.dailyQuota),esc(c.monthlyQuota),c.autoRefill?'Yes':'No',c.fup?'ON':'OFF',esc(c.currentSpeed),c.paid?'Yes':'No'].join(','))
      ].join('\n');
      res.setHeader('Content-Type','text/csv');
      res.setHeader('Content-Disposition','attachment; filename=clients.csv');
      return res.send(rows);
    }
    res.json({ success:true, clients, total:clients.length, generatedAt: new Date() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/reports/inactive
router.get('/inactive', async (req, res) => {
  try {
    const stale = new Date(Date.now()-30*864e5).toISOString().split('T')[0];
    const clients = await Client.find({ owner:req.user._id, $or:[{ status:'inactive' },{ lastSeen:{ $lt:stale, $ne:'' } }] }).sort({ lastSeen:1 });
    res.json({ success:true, clients, total:clients.length, generatedAt: new Date() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/reports/expiry
router.get('/expiry', async (req, res) => {
  try {
    const oid   = req.user._id;
    const today = new Date().toISOString().split('T')[0];
    const d7    = new Date(Date.now()+ 7*864e5).toISOString().split('T')[0];
    const d14   = new Date(Date.now()+14*864e5).toISOString().split('T')[0];
    const d30   = new Date(Date.now()+30*864e5).toISOString().split('T')[0];
    const [w1,w2,w4] = await Promise.all([
      Client.find({ owner:oid, expiry:{ $gte:today, $lte:d7  } }).sort({ expiry:1 }),
      Client.find({ owner:oid, expiry:{ $gt:d7,    $lte:d14  } }).sort({ expiry:1 }),
      Client.find({ owner:oid, expiry:{ $gt:d14,   $lte:d30  } }).sort({ expiry:1 }),
    ]);
    res.json({ success:true, report:{ within7:w1, within14:w2, within30:w4 }, generatedAt: new Date() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
