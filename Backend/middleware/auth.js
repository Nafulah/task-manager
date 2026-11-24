const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
module.exports = async function (req, res, next) {
  try {
    const decoded = jwt.verify(req.header('x-auth-token'), process.env.JWT_SECRET);
    const session = await Session.findOne({ _id: decoded.sid, user: decoded.id, expiresAt: { $gt: new Date() } });
    if (!session) return res.status(401).json({ msg: 'You were logged out due to inactivity.' });
    req.user = { id: decoded.id };
    req.session = session;
    next();
  } catch (err) {
    if (err.name === 'MongoServerError' || err.name === 'MongooseError') return res.status(503).json({ msg: 'Session service unavailable. Please try again.' });
    res.status(401).json({ msg: 'Your session has ended. Please log in again.' });
  }
};
