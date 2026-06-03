const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token' });
    }
    const token   = header.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    const user    = await User.findById(decoded.userId).select('+bmsPass');
    if (!user || !user.isActive) return res.status(401).json({ error: 'Unauthorized' });
    req.user = user;
    next();
  } catch (err) {
    const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
    return res.status(401).json({ error: 'Invalid or expired token', code });
  }
};

// Restrict a route to dashboard admins (admin / superadmin). Use after `auth`.
const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin'))
    return res.status(403).json({ error: 'Admin access required' });
  next();
};

module.exports = { auth, requireAdmin };
