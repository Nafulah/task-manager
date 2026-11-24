const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const auth = require('../middleware/auth');
const router = express.Router();
const emailValid = value => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (typeof name !== 'string' || !name.trim() || !emailValid(email) || typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72)
    return res.status(400).json({ msg: 'Enter a name, valid email, and password of at least 8 characters (maximum 72 bytes).' });
  try {
    if (await User.findOne({ email: email.trim() })) return res.status(400).json({ msg: 'An account with this email already exists.' });
    await User.create({ name: name.trim(), email: email.trim(), password: await bcrypt.hash(password, 10) });
    res.status(201).json({ msg: 'Registered! Please log in.' });
  } catch { res.status(500).json({ msg: 'Unable to register. Please try again.' }); }
});
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!emailValid(email) || typeof password !== 'string' || !password) return res.status(400).json({ msg: 'Enter your email and password.' });
  try {
    const user = await User.findOne({ email: email.trim() });
    if (!user || !await bcrypt.compare(password, user.password)) return res.status(401).json({ msg: 'Email or password is incorrect.' });
    const session = await Session.create({ user: user._id, expiresAt: new Date(Date.now() + 120000) });
    const token = jwt.sign({ id: user.id, sid: session.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch { res.status(500).json({ msg: 'Unable to log in. Please try again.' }); }
});
router.post('/activity', auth, async (req, res) => {
  try {
    const now = Date.now();
    const lastActivity = Number(req.body.lastActivity);
    if (!Number.isFinite(lastActivity) || lastActivity > now + 5000 || lastActivity <= now - 120000) return res.status(400).json({ msg: 'Invalid activity time.' });
    const session = await Session.findOneAndUpdate(
      { _id: req.session.id, expiresAt: { $gt: new Date(now) } },
      { $max: { expiresAt: new Date(Math.min(lastActivity, now) + 120000) } }
    );
    if (!session) return res.status(401).json({ msg: 'You were logged out due to inactivity.' });
    res.sendStatus(204);
  } catch { res.status(503).json({ msg: 'Unable to refresh session. Please try again.' }); }
});
router.post('/logout', auth, async (req, res) => {
  try { await Session.deleteOne({ _id: req.session.id }); res.sendStatus(204); }
  catch { res.status(503).json({ msg: 'Unable to end session. Please try again.' }); }
});
router.get('/user', auth, async (req, res) => {
  try { res.json(await User.findById(req.user.id).select('-password')); }
  catch { res.status(503).json({ msg: 'Unable to load your profile.' }); }
});
module.exports = router;
