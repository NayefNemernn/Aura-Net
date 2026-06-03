const express = require('express');
const router  = express.Router();
const { auth, requireAdmin } = require('../middleware/auth');
const {
  performSimpleAction,
  pingUser,
  captureActionOutput,
  getEditFormData,
  saveEditFormData,
  getUserPageUrl,
} = require('../services/bmsActions');

// All routes require auth
router.use(auth, requireAdmin);

// POST /api/bms/action  — { username, action }
// Actions: refill | disconnect | block | resetMac | changeplan
router.post('/action', async (req, res) => {
  const { username, action } = req.body;
  if (!username || !action) return res.status(400).json({ error: 'username and action required' });
  try {
    const result = await performSimpleAction(req.user._id, username, action);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/bms/ping/:username
router.post('/ping/:username', async (req, res) => {
  try {
    const result = await pingUser(req.user._id, req.params.username);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/bms/output/:username  — { label: 'view rules' | 'user traffic' | 'status on bng' }
router.post('/output/:username', async (req, res) => {
  const { label } = req.body;
  if (!label) return res.status(400).json({ error: 'label required' });
  try {
    const result = await captureActionOutput(req.user._id, req.params.username, label);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/bms/edit/:username  — fetch BMS edit form fields
router.get('/edit/:username', async (req, res) => {
  try {
    const result = await getEditFormData(req.user._id, req.params.username);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/bms/edit/:username  — { fields: { fieldName: value, ... } }
router.patch('/edit/:username', async (req, res) => {
  const { fields } = req.body;
  if (!fields || typeof fields !== 'object') return res.status(400).json({ error: 'fields object required' });
  try {
    const result = await saveEditFormData(req.user._id, req.params.username, fields);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/bms/userpage/:username  — returns BMS user page URL
router.get('/userpage/:username', async (req, res) => {
  try {
    const result = await getUserPageUrl(req.user._id, req.params.username);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
