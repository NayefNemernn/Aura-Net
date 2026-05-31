const router  = require('express').Router();
const QRCode  = require('qrcode');
const { auth }= require('../middleware/auth');
const User    = require('../models/User');
const Client  = require('../models/Client');
const wa      = require('../services/whatsapp');

router.use(auth);

// Resolve the value to encode in the QR / send as the pay link.
function payTarget(whish = {}) {
  return (whish.payLink || whish.number || '').trim();
}

function buildMessage(whish = {}, client = {}) {
  const tpl  = whish.messageTemplate || 'Hello {name}, you can pay via Whish Money:\n{link}';
  const link = payTarget(whish);
  return tpl
    .replace(/\{name\}/g, client.name || client.username || 'there')
    .replace(/\{link\}/g, link)
    .replace(/\{account\}/g, whish.accountName || '')
    .replace(/\{username\}/g, client.username || '');
}

// GET /api/payments/whish — config + a QR data URL for the pay target
router.get('/whish', async (req, res) => {
  try {
    const u = await User.findById(req.user._id);
    const whish  = u.whish || {};
    const target = payTarget(whish);
    let qr = null;
    if (target) {
      qr = await QRCode.toDataURL(target, { width: 320, margin: 1, errorCorrectionLevel: 'M' });
    }
    res.json({
      success: true,
      configured: !!target,
      whish: {
        payLink:         whish.payLink || '',
        number:          whish.number || '',
        accountName:     whish.accountName || '',
        note:            whish.note || '',
        messageTemplate: whish.messageTemplate || '',
      },
      target,
      qr,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/payments/whish/send — send the pay link to a client over WhatsApp
// Body: { clientId }
router.post('/whish/send', async (req, res) => {
  try {
    const { clientId } = req.body;
    if (!clientId) return res.status(400).json({ error: 'clientId is required' });

    const u = await User.findById(req.user._id);
    const target = payTarget(u.whish);
    if (!target) return res.status(400).json({ error: 'Whish payment link/number not set. Add it in Settings.' });

    const client = await Client.findOne({ _id: clientId, owner: req.user._id });
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const phone = client.phone || client.mobile;
    if (!phone) return res.status(400).json({ error: 'This client has no phone number on file' });

    const { status } = wa.getState();
    if (status !== 'ready') return res.status(400).json({ error: 'WhatsApp not connected' });

    const message = buildMessage(u.whish, client);
    await wa.sendMessage(phone, message);

    res.json({ success: true, sentTo: phone, message });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
