const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email i hasło są wymagane' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Nieprawidłowe dane logowania' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'Nieprawidłowe dane logowania' });
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd logowania' });
  }
};

exports.me = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Brak uwierzytelnienia' });
    const user = await User.findById(req.user.id).select('-passwordHash');
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd' });
  }
};
