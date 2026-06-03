const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const { auth } = require('../middleware/auth');

const sign = (id, secret, exp) => jwt.sign({ userId: id }, secret, { expiresIn: exp });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password required' });

    if (await User.findOne({ email }))
      return res.status(409).json({ error: 'Email already registered' });

    const user = new User({ name, email, phone, password, role: 'viewer' });
    await user.save();

    const accessToken  = sign(user._id, process.env.JWT_SECRET         || 'dev_secret',  process.env.JWT_EXPIRES_IN         || '15m');
    const refreshToken = sign(user._id, process.env.JWT_REFRESH_SECRET || 'dev_refresh', process.env.JWT_REFRESH_EXPIRES_IN || '7d');
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({ accessToken, refreshToken, user: user.toSafeObject() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/register-admin  — gated by ADMIN_SIGNUP_CODE; creates an admin with BMS access
router.post('/register-admin', async (req, res) => {
  try {
    const { name, email, phone, password, adminCode, bmsUrl, bmsUser, bmsPass } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password required' });

    const expected = process.env.ADMIN_SIGNUP_CODE;
    if (!expected)
      return res.status(403).json({ error: 'Admin registration is disabled' });
    if (adminCode !== expected)
      return res.status(403).json({ error: 'Invalid admin code' });

    if (await User.findOne({ email }))
      return res.status(409).json({ error: 'Email already registered' });

    const user = new User({ name, email, phone, password, role: 'admin', bmsUrl, bmsUser, bmsPass });
    await user.save();

    const accessToken  = sign(user._id, process.env.JWT_SECRET         || 'dev_secret',  process.env.JWT_EXPIRES_IN         || '15m');
    const refreshToken = sign(user._id, process.env.JWT_REFRESH_SECRET || 'dev_refresh', process.env.JWT_REFRESH_EXPIRES_IN || '7d');
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({ accessToken, refreshToken, user: user.toSafeObject() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user || !await user.comparePassword(password))
      return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.isActive)
      return res.status(403).json({ error: 'Account disabled' });

    const accessToken  = sign(user._id, process.env.JWT_SECRET         || 'dev_secret',  process.env.JWT_EXPIRES_IN         || '15m');
    const refreshToken = sign(user._id, process.env.JWT_REFRESH_SECRET || 'dev_refresh', process.env.JWT_REFRESH_EXPIRES_IN || '7d');
    user.refreshToken = refreshToken;
    user.lastLogin    = new Date();
    await user.save();

    res.json({ accessToken, refreshToken, user: user.toSafeObject() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'dev_refresh');
    const user    = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken)
      return res.status(401).json({ error: 'Invalid refresh token' });

    const accessToken  = sign(user._id, process.env.JWT_SECRET         || 'dev_secret',  process.env.JWT_EXPIRES_IN         || '15m');
    const newRefresh   = sign(user._id, process.env.JWT_REFRESH_SECRET || 'dev_refresh', process.env.JWT_REFRESH_EXPIRES_IN || '7d');
    user.refreshToken  = newRefresh;
    await user.save();

    res.json({ accessToken, refreshToken: newRefresh });
  } catch { res.status(401).json({ error: 'Invalid or expired refresh token' }); }
});

// POST /api/auth/logout
router.post('/logout', auth, async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => res.json({ user: req.user.toSafeObject() }));

// PATCH /api/auth/password
router.patch('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!await user.comparePassword(currentPassword))
      return res.status(401).json({ error: 'Current password incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
