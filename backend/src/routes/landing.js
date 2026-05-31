const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { auth } = require('../middleware/auth');
const LandingContent = require('../models/LandingContent');

// ── File upload setup ──────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../uploads/landing');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename:    (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`);
    },
  }),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['.jpg','.jpeg','.png','.gif','.webp'].includes(
      path.extname(file.originalname).toLowerCase()
    );
    cb(null, ok);
  },
});

// ── Helpers ────────────────────────────────────────────────────────
function extractYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/);
  return m ? m[1] : null;
}

async function getDoc() {
  return LandingContent.findOneAndUpdate(
    { _key: 'main' },
    { $setOnInsert: { _key: 'main' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

// ── Public ─────────────────────────────────────────────────────────
// GET /api/landing
router.get('/', async (req, res) => {
  try {
    const doc = await getDoc();
    res.json({ content: doc });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Admin — text content ────────────────────────────────────────────
// PUT /api/landing
router.put('/', auth, async (req, res) => {
  const { hero, offers, plans, contact, sectionTitles } = req.body;
  try {
    const update = {};
    if (hero)          update.hero          = hero;
    if (offers)        update.offers        = offers;
    if (plans)         update.plans         = plans;
    if (contact)       update.contact       = contact;
    if (sectionTitles) update.sectionTitles = sectionTitles;
    const doc = await LandingContent.findOneAndUpdate(
      { _key: 'main' }, { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, content: doc });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Admin — media ──────────────────────────────────────────────────
// POST /api/landing/media/youtube
router.post('/media/youtube', auth, async (req, res) => {
  const { url, title, description } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });
  const videoId = extractYouTubeId(url);
  if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL' });
  try {
    const doc = await getDoc();
    doc.media.push({ type:'youtube', url, videoId, title:title||'', description:description||'', order: doc.media.length });
    await doc.save();
    res.json({ success: true, media: doc.media });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/landing/media/photo
router.post('/media/photo', auth, upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded or invalid type' });
  const { title, description } = req.body;
  const photoUrl = `/uploads/landing/${req.file.filename}`;
  try {
    const doc = await getDoc();
    doc.media.push({ type:'photo', url: photoUrl, title:title||'', description:description||'', order: doc.media.length });
    await doc.save();
    res.json({ success: true, media: doc.media, url: photoUrl });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/landing/media/:id — update title/description
router.patch('/media/:id', auth, async (req, res) => {
  const { title, description } = req.body;
  try {
    const doc = await getDoc();
    const item = doc.media.id(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (title       !== undefined) item.title       = title;
    if (description !== undefined) item.description = description;
    await doc.save();
    res.json({ success: true, media: doc.media });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/landing/media/:id
router.delete('/media/:id', auth, async (req, res) => {
  try {
    const doc = await getDoc();
    const item = doc.media.id(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (item.type === 'photo' && item.url) {
      fs.unlink(path.join(__dirname, '../../', item.url), () => {});
    }
    item.deleteOne();
    // Re-order
    doc.media.forEach((m, i) => { m.order = i; });
    await doc.save();
    res.json({ success: true, media: doc.media });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Admin — pop-up ad ──────────────────────────────────────────────
// PUT /api/landing/ad — update ad text/flags
router.put('/ad', auth, async (req, res) => {
  const { enabled, title, body, linkUrl, ctaLabel } = req.body;
  try {
    const doc = await getDoc();
    if (enabled  !== undefined) doc.ad.enabled  = !!enabled;
    if (title    !== undefined) doc.ad.title    = title;
    if (body     !== undefined) doc.ad.body     = body;
    if (linkUrl  !== undefined) doc.ad.linkUrl  = linkUrl;
    if (ctaLabel !== undefined) doc.ad.ctaLabel = ctaLabel;
    doc.ad.updatedAt = new Date();
    await doc.save();
    res.json({ success: true, ad: doc.ad });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/landing/ad/image — upload the ad image
router.post('/ad/image', auth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded or invalid type' });
  const imageUrl = `/uploads/landing/${req.file.filename}`;
  try {
    const doc = await getDoc();
    if (doc.ad.imageUrl) fs.unlink(path.join(__dirname, '../../', doc.ad.imageUrl), () => {});
    doc.ad.imageUrl  = imageUrl;
    doc.ad.updatedAt = new Date();
    await doc.save();
    res.json({ success: true, ad: doc.ad, url: imageUrl });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/landing/ad/image — remove the ad image
router.delete('/ad/image', auth, async (req, res) => {
  try {
    const doc = await getDoc();
    if (doc.ad.imageUrl) fs.unlink(path.join(__dirname, '../../', doc.ad.imageUrl), () => {});
    doc.ad.imageUrl  = '';
    doc.ad.updatedAt = new Date();
    await doc.save();
    res.json({ success: true, ad: doc.ad });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/landing/media/reorder — body: { ids: ['id1','id2',...] }
router.patch('/media/reorder', auth, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array required' });
  try {
    const doc = await getDoc();
    ids.forEach((id, i) => {
      const item = doc.media.id(id);
      if (item) item.order = i;
    });
    doc.media.sort((a, b) => a.order - b.order);
    await doc.save();
    res.json({ success: true, media: doc.media });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
