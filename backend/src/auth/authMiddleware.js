const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// middleware that sets req.user if token provided, otherwise continues
exports.optionalAuth = async (req, res, next) => {
  const auth = req.get('Authorization') || req.get('authorization');
  if (!auth) return next();
  const parts = auth.split(' ');
  if (parts.length !== 2) return next();
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id).select('-passwordHash');
    if (user) req.user = { id: user._id, role: user.role };
  } catch (err) {
    // ignore token errors for optional auth
  }
  return next();
};

exports.requireAuth = async (req, res, next) => {
  const auth = req.get('Authorization') || req.get('authorization');
  if (!auth) return res.status(401).json({ error: 'Brak tokena autoryzacyjnego' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Niepoprawny nagłówek autoryzacji' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id).select('-passwordHash');
    if (!user) return res.status(401).json({ error: 'Nieprawidłowy token' });
    req.user = { id: user._id, role: user.role };
    return next();
  } catch (err) {
    console.error('Auth error', err);
    return res.status(401).json({ error: 'Nieprawidłowy token' });
  }
};

// requireAdmin: allow admin and super_admin
exports.requireAdmin = async (req, res, next) => {
  try {
    await exports.requireAuth(req, res, async () => {
      if (!req.user) return res.status(401).json({ error: 'Brak uwierzytelnienia' });
      if (req.user.role === 'admin' || req.user.role === 'super_admin') return next();
      return res.status(403).json({ error: 'Brak uprawnień (admin required)' });
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Błąd autoryzacji' });
  }
};

// requireSuperAdmin: allow only super_admin
exports.requireSuperAdmin = async (req, res, next) => {
  try {
    await exports.requireAuth(req, res, async () => {
      if (!req.user) return res.status(401).json({ error: 'Brak uwierzytelnienia' });
      if (req.user.role === 'super_admin') return next();
      return res.status(403).json({ error: 'Brak uprawnień (super_admin required)' });
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Błąd autoryzacji' });
  }
};
