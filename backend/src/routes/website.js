const router = require('express').Router();
const { auth, requireAdmin } = require('../middleware/auth');
const User    = require('../models/User');
const wa      = require('../services/whatsapp');
const qrcard  = require('../services/qrcard');

router.use(auth, requireAdmin);

// Effective website URL: explicit ?url / body.url (live preview before saving)
// falls back to the saved siteUrl setting.
async function resolve(req) {
  const u   = await User.findById(req.user._id);
  const url = (req.query.url || req.body?.url || u.siteUrl || '').trim();
  const title = (u.whish?.accountName || u.name || 'Aura Net');
  return { u, url, title };
}

// GET /api/website/qr — QR data URL for the website
router.get('/qr', async (req, res) => {
  try {
    const { url } = await resolve(req);
    if (!url) return res.json({ success: true, configured: false, url: '', qr: null });
    const { dataUrl } = await qrcard.buildPng(url);
    res.json({ success: true, configured: true, url, qr: dataUrl });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/website/qr.pdf — downloadable branded PDF card
router.get('/qr.pdf', async (req, res) => {
  try {
    const { url, title } = await resolve(req);
    if (!url) return res.status(400).json({ error: 'Website URL not set. Add it in Settings.' });
    const pdf = await qrcard.buildPdf(url, { title });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="website-qr.pdf"');
    res.send(pdf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/website/qr/send — send the QR to a WhatsApp number
// Body: { phone, format: 'image' | 'pdf', url?, caption? }
router.post('/qr/send', async (req, res) => {
  try {
    const { phone, format = 'image', caption } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    const { url, title } = await resolve(req);
    if (!url) return res.status(400).json({ error: 'Website URL not set. Add it in Settings.' });
    if (wa.getState().status !== 'ready') return res.status(400).json({ error: 'WhatsApp not connected' });

    const text = (caption && caption.trim()) || `Visit our website:\n${url}`;

    if (format === 'pdf') {
      const pdf = await qrcard.buildPdf(url, { title });
      await wa.sendDocument(phone, pdf.toString('base64'), 'application/pdf', 'website-qr.pdf', text);
    } else {
      const { base64 } = await qrcard.buildPng(url);
      await wa.sendImage(phone, base64, text);
    }

    res.json({ success: true, sentTo: phone, format });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
